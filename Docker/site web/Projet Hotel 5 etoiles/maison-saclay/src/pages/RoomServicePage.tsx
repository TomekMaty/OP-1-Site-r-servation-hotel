import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Trash2, ShoppingBag, CheckCircle, BedDouble } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { useAuth } from "@/lib/auth-context";
import { fetchMenu, fetchMyBookings, createOrder, type MenuItem, type MenuByCategory, type MyBooking } from "@/services/api";
import { cn, formatPrice } from "@/lib/utils";

interface CartItem extends MenuItem { qty: number; }

const CATEGORY_LABELS: Record<string, string> = {
  brunch: "Brunch", plat: "Plats", boisson: "Boissons", dessert: "Desserts",
};
const CATEGORY_HOURS: Record<string, string> = {
  brunch: "Servi de 7h à 11h", plat: "Disponible de 11h à 22h",
  boisson: "Disponible toute la journée", dessert: "Disponible de 12h à 22h",
};
const MENU_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80";

export function RoomServicePage() {
  const { isLogged } = useAuth();
  const navigate = useNavigate();

  const [menu,          setMenu]          = useState<MenuByCategory>({});
  const [cart,          setCart]          = useState<CartItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [activeBooking, setActiveBooking] = useState<MyBooking | null>(null);
  const [notes,         setNotes]         = useState("");
  const [ordering,      setOrdering]      = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [error,         setError]         = useState("");
  const [activeTab,     setActiveTab]     = useState("brunch");

  useEffect(() => {
    if (!isLogged) { navigate("/connexion?redirect=/room-service"); return; }
    const today = new Date().toISOString().split("T")[0];
    Promise.all([fetchMenu(), fetchMyBookings()]).then(([nextMenu, bookings]) => {
      setMenu(nextMenu);
      setActiveTab(Object.keys(nextMenu)[0] ?? "brunch");
      // Réservation active avec chambre physique attribuée
      const active = bookings.find(
        (b) => (b.status === "confirmed" || b.status === "pending")
          && b.check_in <= today
          && b.check_out > today
          && b.room_number !== null
      ) ?? null;
      setActiveBooking(active);
    }).finally(() => setLoading(false));
  }, [isLogged, navigate]);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((current) => current.id === item.id);
      if (existing) {
        return prev.map((current) => (current.id === item.id ? { ...current, qty: current.qty + 1 } : current));
      }

      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((current) => (current.id === id ? { ...current, qty: current.qty + delta } : current))
        .filter((current) => current.qty > 0)
    );
  };

  const removeFromCart = (id: number) => setCart((prev) => prev.filter((current) => current.id !== id));

  const handleOrder = async () => {
    if (cart.length === 0) { setError("Votre panier est vide"); return; }
    setError(""); setOrdering(true);
    try {
      await createOrder({
        // room_number non requis : le backend le détecte depuis la réservation active
        items: cart.map((item) => ({ menu_item_id: item.id, quantity: item.qty })),
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
      setCart([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la commande");
    } finally {
      setOrdering(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center px-6">
        <motion.div
          className="text-center max-w-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <CheckCircle size={48} className="text-gold mx-auto mb-6" strokeWidth={1} />
          <h2 className="font-serif text-3xl font-light text-ivory mb-3">Commande passée</h2>
          <p className="text-ivory/45 font-light text-sm leading-relaxed mb-8">
            Votre commande a été transmise à la cuisine.
            <br />
            Livraison estimée : 20-35 minutes.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              navigate("/mon-espace");
            }}
            className="px-8 py-3 bg-gold text-charcoal text-2xs tracking-luxury uppercase hover:bg-gold/90 transition-colors"
          >
            Voir mes commandes
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Room Service"
        description="Commandez depuis votre chambre. Livraison 20-35 minutes. Menu brunch, plats, boissons et desserts."
      />

      <div className="relative h-72 overflow-hidden flex items-end">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=85"
          alt="Room Service"
          className="absolute inset-0 w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />
        <div className="relative px-6 lg:px-16 pb-10 w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="text-2xs tracking-luxury uppercase text-gold block mb-2">Room Service</span>
            <h1 className="font-serif text-4xl font-light text-ivory">
              Votre table, <em className="italic text-ivory/50">dans votre chambre</em>
            </h1>
            <p className="text-ivory/40 font-light text-sm mt-2">Disponible 7h – 22h · Livraison 20–35 min</p>
          </motion.div>
        </div>
      </div>

      {loading && <div className="text-center py-24 text-charcoal/30 font-light text-sm">Chargement du menu…</div>}

      {!loading && (
        <div className="flex flex-col lg:flex-row max-w-none">
          <div className="flex-1 px-6 lg:px-16 py-10">
            <div className="flex border border-border bg-white w-fit mb-12">
              {Object.keys(menu).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={cn(
                    "px-5 py-3 text-2xs tracking-luxury uppercase border-r border-border last:border-0 transition-colors",
                    activeTab === cat ? "bg-charcoal text-ivory" : "text-charcoal/50 hover:text-charcoal"
                  )}
                >
                  {CATEGORY_LABELS[cat] ?? cat}
                </button>
              ))}
            </div>

            {Object.entries(menu).map(([cat, items]) => (
              <div key={cat} className={cat === activeTab ? "block" : "hidden"}>
                <div className="flex items-baseline gap-4 mb-8 pb-5 border-b border-border">
                  <h2 className="font-serif text-3xl font-light text-charcoal">{CATEGORY_LABELS[cat] ?? cat}</h2>
                  <span className="text-xs font-light text-charcoal/40">{CATEGORY_HOURS[cat]}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
                  {items.map((item, i) => {
                    const inCart = cart.find((current) => current.id === item.id);
                    const featured = i === 0;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn("bg-white flex", featured && "md:col-span-2")}
                      >
                        <img
                          src={item.image_url}
                          alt={item.name}
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = MENU_IMAGE_FALLBACK;
                          }}
                          className={cn("object-cover flex-shrink-0", featured ? "w-56 h-auto" : "w-24 h-full")}
                        />
                        <div className="flex-1 p-5 flex flex-col justify-between">
                          <div>
                            <p className="font-serif text-lg font-light text-charcoal mb-1">{item.name}</p>
                            <p className="text-xs font-light text-charcoal/50 leading-relaxed">{item.description}</p>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <span className="font-serif text-xl font-light text-charcoal">{formatPrice(item.price)}</span>
                            {inCart ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQty(item.id, -1)}
                                  className="w-7 h-7 border border-border flex items-center justify-center hover:bg-charcoal hover:text-ivory hover:border-charcoal transition-colors"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-sm font-light w-4 text-center">{inCart.qty}</span>
                                <button
                                  onClick={() => updateQty(item.id, 1)}
                                  className="w-7 h-7 border border-charcoal bg-charcoal text-ivory flex items-center justify-center"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="w-8 h-8 border border-border flex items-center justify-center hover:bg-charcoal hover:text-ivory hover:border-charcoal transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="w-full lg:w-[340px] flex-shrink-0 bg-white border-l border-border lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag size={15} className="text-charcoal/50" />
                <h3 className="font-serif text-lg font-light text-charcoal">Votre commande</h3>
                {cartCount > 0 && (
                  <span className="ml-auto text-2xs bg-charcoal text-ivory w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 px-5 py-4">
              <AnimatePresence>
                {cart.length === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-light text-charcoal/30 italic text-center py-8"
                  >
                    Votre panier est vide
                  </motion.p>
                )}

                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex gap-3 py-4 border-b border-border last:border-0"
                  >
                    <img
                      src={item.image_url}
                      alt={item.name}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = MENU_IMAGE_FALLBACK;
                      }}
                      className="w-12 h-12 object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm font-light text-charcoal leading-tight mb-2">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-5 h-5 border border-border flex items-center justify-center text-charcoal/60 hover:bg-red-50 hover:border-red-200"
                        >
                          <Minus size={9} />
                        </button>
                        <span className="text-xs font-light w-4 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-5 h-5 border border-border flex items-center justify-center text-charcoal/60"
                        >
                          <Plus size={9} />
                        </button>
                        <span className="ml-auto text-sm font-light text-charcoal">{formatPrice(item.price * item.qty)}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-charcoal/20 hover:text-red-400 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="p-5 border-t border-border space-y-4">

              {/* Livraison automatique en chambre */}
              {activeBooking?.room_number ? (
                <div className="flex items-center gap-3 bg-charcoal px-4 py-3">
                  <BedDouble size={16} className="text-gold flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-2xs tracking-luxury uppercase text-gold/80 font-light">Livraison en</p>
                    <p className="font-serif text-xl font-light text-ivory leading-tight">
                      Chambre {activeBooking.room_number}
                    </p>
                    <p className="text-2xs text-ivory/35 font-light mt-0.5">{activeBooking.room_name}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 px-3 py-2.5">
                  <p className="text-xs font-light text-amber-800">
                    Aucun séjour actif détecté. Contactez la réception pour passer une commande.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-2xs tracking-luxury uppercase text-charcoal/40 mb-2">Note (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergies, préférences…"
                  rows={2}
                  className="w-full border border-border px-3 py-2.5 text-sm font-light text-charcoal resize-none outline-none focus:border-charcoal placeholder:text-charcoal/25 transition-colors"
                />
              </div>

              {error && <p className="text-xs text-red-500 font-light">{error}</p>}

              <div className="flex items-baseline justify-between">
                <span className="text-2xs tracking-luxury uppercase text-charcoal/40">Total</span>
                <span className="font-serif text-2xl font-light text-charcoal">{formatPrice(total)}</span>
              </div>

              <button
                onClick={handleOrder}
                disabled={ordering || cart.length === 0}
                className="w-full py-4 bg-charcoal text-ivory text-2xs tracking-luxury uppercase hover:bg-charcoal/90 transition-colors disabled:opacity-40"
              >
                {ordering ? "Envoi..." : `Commander · ${formatPrice(total)}`}
              </button>
              <p className="text-2xs text-charcoal/30 text-center leading-relaxed">
                Ajouté à votre note de chambre
                <br />
                Règlement au départ
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
