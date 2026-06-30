"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin, Plus, CreditCard, Lock, ChevronRight, Check,
  Truck, Package,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { getCart } from "@/lib/services/cart.service";
import { getAddresses } from "@/lib/services/user.service";
import { createOrder, verifyPayment } from "@/lib/services/order.service";
import { useDispatch, useSelector } from "react-redux";
import { clearCart as clearCartStore } from "@/store/slices/cartSlice";
import toast from "react-hot-toast";
import Link from "next/link";

const FREE_SHIPPING_ABOVE = 500;
const SHIPPING_CHARGE = 50;

// Load Razorpay script dynamically
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function AddressCard({ address, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(address._id)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-foreground text-sm">{address.name}</p>
            {address.isDefault && (
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {address.street}, {address.city}, {address.state} — {address.pincode}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{address.phone}</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
          selected ? "border-primary bg-primary" : "border-border"
        }`}>
          {selected && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>
    </button>
  );
}

function OrderItemRow({ item }) {
  const product = item.product;
  const price = product?.discountPrice ?? product?.price ?? item.priceAtAdd ?? 0;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0 border border-border/50">
        {product?.images?.[0]?.url ? (
          <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{product?.name}</p>
        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
      </div>
      <p className="text-sm font-semibold text-foreground flex-shrink-0">
        ₹{(price * item.quantity).toLocaleString("en-IN")}
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated, role } = useSelector((s) => s.auth);

  const [cartData, setCartData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState(1); // 1=address, 2=review

  useEffect(() => {
    if (!isAuthenticated || role !== "customer") {
      router.replace("/login");
      return;
    }
    Promise.all([
      getCart(),
      getAddresses(),
    ]).then(([cartRes, addrRes]) => {
      const c = cartRes?.cart ?? null;
      setCartData(c);
      const addrs = addrRes ?? [];
      setAddresses(addrs);
      const def = addrs.find((a) => a.isDefault)?._id ?? addrs[0]?._id ?? "";
      setSelectedAddress(def);
    }).catch(() => toast.error("Failed to load checkout"))
      .finally(() => setLoading(false));
  }, []);

  const items = cartData?.items ?? [];
  const subtotal = items.reduce((acc, item) => {
    const price = item.product?.discountPrice ?? item.product?.price ?? item.priceAtAdd ?? 0;
    return acc + price * item.quantity;
  }, 0);
  const shipping = subtotal >= FREE_SHIPPING_ABOVE ? 0 : items.length > 0 ? SHIPPING_CHARGE : 0;
  const total = subtotal + shipping;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error("Please select a delivery address"); return; }
    if (items.length === 0) { toast.error("Your cart is empty"); return; }

    const loaded = await loadRazorpayScript();
    if (!loaded) { toast.error("Failed to load payment gateway. Please try again."); return; }

    setPlacing(true);
    try {
      // Create server-side order
      const orderData = await createOrder({ addressId: selectedAddress });

      // Launch Razorpay checkout
      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ShopEase",
        description: "Order Payment",
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: user?.name ?? "",
          email: user?.email ?? "",
          contact: user?.phone ?? "",
        },
        theme: { color: "#16a34a" },
        handler: async (response) => {
          try {
            await verifyPayment({
              orderId: orderData.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            dispatch(clearCartStore());
            toast.success("Payment successful! 🎉");
            router.push(`/order-confirmation/${orderData.orderId}`);
          } catch (err) {
            toast.error(err?.message ?? "Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => {
            setPlacing(false);
            toast("Payment cancelled");
          },
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(err?.message ?? "Failed to create order");
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-[72px]">
          <div className="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center pt-[72px] text-center p-6">
          <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold mb-2">Nothing to checkout</h2>
          <p className="text-muted-foreground text-sm mb-6">Your cart is empty. Add some items first.</p>
          <Link href="/shop" className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90">
            Browse Products
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <Navbar />
      <div className="pt-[72px]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
            Checkout
          </h1>

          {/* Steps */}
          <div className="flex items-center gap-3 mb-8">
            {[
              { n: 1, label: "Delivery Address" },
              { n: 2, label: "Review & Pay" },
            ].map(({ n, label }, i) => (
              <div key={n} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground/40" />}
                <div
                  onClick={() => n < step && setStep(n)}
                  className={`flex items-center gap-2 ${n < step ? "cursor-pointer" : ""}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === n ? "bg-primary text-white" :
                    step > n ? "bg-emerald-500 text-white" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {step > n ? <Check className="w-3.5 h-3.5" /> : n}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${step === n ? "text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-4">
              {step === 1 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-foreground flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                        <MapPin className="w-4 h-4 text-primary" /> Delivery Address
                      </h2>
                      <Link href="/profile" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add New
                      </Link>
                    </div>

                    {addresses.length === 0 ? (
                      <div className="text-center py-6">
                        <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">No saved addresses</p>
                        <Link href="/profile" className="text-sm text-primary font-semibold hover:underline">
                          Add a delivery address →
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {addresses.map((addr) => (
                          <AddressCard
                            key={addr._id}
                            address={addr}
                            selected={selectedAddress === addr._id}
                            onSelect={setSelectedAddress}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (!selectedAddress) { toast.error("Please select an address"); return; }
                      setStep(2);
                    }}
                    disabled={!selectedAddress}
                    className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40"
                  >
                    Continue to Review
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Selected address summary */}
                  <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> Delivering to
                      </h3>
                      <button onClick={() => setStep(1)} className="text-xs text-primary hover:underline">Change</button>
                    </div>
                    {(() => {
                      const addr = addresses.find((a) => a._id === selectedAddress);
                      return addr ? (
                        <p className="text-sm text-muted-foreground">
                          {addr.name} · {addr.street}, {addr.city}, {addr.state} {addr.pincode} · {addr.phone}
                        </p>
                      ) : null;
                    })()}
                  </div>

                  {/* Order items */}
                  <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
                    <h3 className="font-bold text-foreground mb-3 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                      <Package className="w-4 h-4 text-primary" /> Order Items ({items.length})
                    </h3>
                    <div>
                      {items.map((item) => (
                        <OrderItemRow key={item.product?._id ?? item._id} item={item} />
                      ))}
                    </div>
                  </div>

                  {/* Payment info */}
                  <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
                    <h3 className="font-bold text-foreground mb-3 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                      <CreditCard className="w-4 h-4 text-primary" /> Payment
                    </h3>
                    <div className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl">
                      <img
                        src="https://razorpay.com/assets/razorpay-logo.svg"
                        alt="Razorpay"
                        className="h-5 object-contain"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">Razorpay Secure Payment</p>
                        <p className="text-xs text-muted-foreground">UPI · Cards · NetBanking · Wallets</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Your payment is encrypted and secure
                    </p>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    {placing ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
                    ) : (
                      <><Lock className="w-4 h-4" /> Pay ₹{total.toLocaleString("en-IN")}</>
                    )}
                  </button>
                </motion.div>
              )}
            </div>

            {/* Order summary sidebar */}
            <div>
              <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4 sticky top-[90px]">
                <h3 className="font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>Price Details</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Price ({items.length} item{items.length !== 1 ? "s" : ""})</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery</span>
                    <span className={shipping === 0 ? "text-emerald-600 font-medium" : ""}>
                      {shipping === 0 ? "FREE" : `₹${shipping}`}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2.5 flex justify-between font-bold text-foreground text-base">
                    <span>Total Amount</span>
                    <span>₹{total.toLocaleString("en-IN")}</span>
                  </div>
                  {subtotal >= FREE_SHIPPING_ABOVE && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Free delivery applied!
                    </p>
                  )}
                </div>

                {/* Mini cart preview */}
                <div className="border-t border-border pt-3 space-y-2">
                  {items.slice(0, 3).map((item) => (
                    <div key={item.product?._id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-7 h-7 rounded bg-secondary flex-shrink-0 overflow-hidden">
                        {item.product?.images?.[0]?.url ? (
                          <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                        ) : <div className="w-full h-full flex items-center justify-center">📦</div>}
                      </div>
                      <span className="truncate flex-1">{item.product?.name}</span>
                      <span>×{item.quantity}</span>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{items.length - 3} more item{items.length - 3 !== 1 ? "s" : ""}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
