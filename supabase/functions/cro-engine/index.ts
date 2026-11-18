// =================================================================================
// SUPABASE EDGE FUNCTION: `supabase/functions/cro-engine/index.ts`
// تنفذ كل منطق الهدايا والخصومات وعجلة الحظ والإحالة والتحقق من الطلبات في السيرفر
// =================================================================================

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, payload } = body;

    // Helper: Check if a feature flag is enabled on the server before executing ANY feature logic
    async function assertFlagEnabled(flagKey: string) {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("key, enabled, config")
        .eq("key", flagKey)
        .single();

      if (error || !data || data.enabled === false) {
        throw new Error(`FEATURE_DISABLED:${flagKey}`);
      }
      return data;
    }

    // 1. ACTION: SPIN THE WHEEL (Server-determined prize, 7-day cooldown per user_id/phone)
    if (action === "spin_wheel") {
      await assertFlagEnabled("spin_to_win");
      const { userId, phoneOrEmail, prizes } = payload || {};
      const { data, error } = await supabase.rpc("rpc_spin_wheel", {
        p_user_id: userId || "",
        p_phone_or_email: phoneOrEmail || "",
        p_prizes: prizes || [],
      });
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        status: data?.ok ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. ACTION: CLAIM EXIT-INTENT OFFER (Once per 24h, requires phone/email or account)
    if (action === "claim_exit_intent") {
      const flag = await assertFlagEnabled("exit_intent_popup");
      const { userId, phoneOrEmail, cartSubtotal } = payload || {};
      const cleanContact = String(phoneOrEmail || userId || "").trim();
      if (!cleanContact || cleanContact === "guest" || cleanContact.length < 5) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "AUTH_REQUIRED",
            message: "يرجى إدخال رقم الهاتف أو البريد الإلكتروني لتفعيل كوبون الخصم الفوري.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!cartSubtotal || Number(cartSubtotal) <= 0) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "EMPTY_CART",
            message: "نافذة الخروج الذكية تعمل فقط عند وجود منتجات في السلة.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const dayKey = new Date().toISOString().slice(0, 10);
      const { data: existing } = await supabase
        .from("user_rewards")
        .select("*")
        .eq("user_id", cleanContact)
        .eq("reward_type", "exit_intent_24h")
        .eq("period_key", dayKey)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "COOLDOWN_24H",
            message: "لقد حصلت على عرض الخروج اليوم بالفعل، يمكنك استخدامه مرة واحدة كل 24 ساعة.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const code = String(flag.config?.promo_code || "STAY5").toUpperCase();
      const pct = Number(flag.config?.discount_pct) || 5;

      await supabase.from("user_rewards").insert({
        user_id: cleanContact,
        reward_type: "exit_intent_24h",
        period_key: dayKey,
        source: "exit_intent_popup",
        coupon_code: code,
        discount_value: pct,
      });

      return new Response(
        JSON.stringify({ ok: true, coupon_code: code, discount_pct: pct }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. ACTION: VALIDATE ORDER, COUPONS, LOYALTY & 2,000,000 EGP SALES CAP AT CHECKOUT
    if (action === "validate_and_create_order") {
      const { userId, phone, subtotalEgp, deliveryFeeEgp, couponCode, referralCode, deviceFingerprint } = payload || {};
      const { data, error } = await supabase.rpc("rpc_validate_and_create_order", {
        p_user_id: userId || "guest",
        p_phone: phone || "",
        p_subtotal_egp: Number(subtotalEgp) || 0,
        p_delivery_fee_egp: Number(deliveryFeeEgp) || 0,
        p_coupon_code: couponCode || null,
        p_referral_code: referralCode || null,
        p_device_fingerprint: deviceFingerprint || null,
      });
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        status: data?.ok ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. ACTION: COMPLETE REFERRAL ON FIRST PAID/DELIVERED ORDER (Issues 2 coupons in 1 transaction!)
    if (action === "complete_referral") {
      await assertFlagEnabled("referral_program");
      const { referredUserId, orderId } = payload || {};
      const { data, error } = await supabase.rpc("rpc_complete_referral_on_delivery", {
        p_referred_user_id: referredUserId,
        p_order_id: orderId,
      });
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. ACTION: VERIFY SECRET VIP ACCESS ON SERVER BY LOYALTY TIER / TOTAL SPENT
    if (action === "verify_vip_access") {
      const flag = await assertFlagEnabled("vip_secret_route");
      const { userId } = payload || {};
      const minSpent = Number(flag.config?.min_spent_egp) || 15000;

      const { data: orders } = await supabase
        .from("orders")
        .select("items, discount_base, status")
        .eq("client_id", userId)
        .eq("status", "تم التسليم");

      const totalPaid = (orders || []).reduce((sum: number, ord: any) => {
        const itemsSum = Array.isArray(ord.items)
          ? ord.items.reduce((s: number, i: any) => s + Number(i.qty || 1) * Number(i.unitPriceBase || 0), 0)
          : 0;
        return sum + Math.max(0, itemsSum - Number(ord.discount_base || 0));
      }, 0);

      const allowed = totalPaid >= minSpent;
      return new Response(
        JSON.stringify({
          ok: allowed,
          total_paid_egp: totalPaid,
          required_spent_egp: minSpent,
          message: allowed
            ? "مرحباً بك في قسم كبار العملاء VIP المعتمد!"
            : `قسم VIP متاح فقط للعملاء الذين تخطت مشترياتهم الفعلية المسلمة ${minSpent.toLocaleString()} ج.م (مشترياتك الحالية: ${totalPaid.toLocaleString()} ج.م).`,
        }),
        { status: allowed ? 200 : 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ ok: false, error: "UNKNOWN_ACTION" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const msg = String(err?.message || err);
    const isDisabled = msg.startsWith("FEATURE_DISABLED:");
    return new Response(
      JSON.stringify({
        ok: false,
        error: isDisabled ? "FEATURE_DISABLED" : "SERVER_ERROR",
        message: isDisabled ? "هذه الميزة متوقفة حالياً من لوحة التحكم." : msg,
      }),
      { status: isDisabled ? 403 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
