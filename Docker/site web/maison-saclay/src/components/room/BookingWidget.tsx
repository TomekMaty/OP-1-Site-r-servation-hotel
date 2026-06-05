import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { differenceInDays, format, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { cn, formatPrice } from "@/lib/utils";
import { createBooking } from "@/services/api";
import type { Room } from "@/types/room";

const schema = z
  .object({
    checkIn: z.string().min(1, "Date d'arrivee requise"),
    checkOut: z.string().min(1, "Date de depart requise"),
    guests: z.number().min(1),
  })
  .refine(
    (data) => !data.checkIn || !data.checkOut || new Date(data.checkOut) > new Date(data.checkIn),
    { message: "Le depart doit etre apres l'arrivee", path: ["checkOut"] }
  );

type FormData = z.infer<typeof schema>;

const today = format(new Date(), "yyyy-MM-dd");
const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

const inputCls = (err: boolean) =>
  cn(
    "w-full px-4 py-3 bg-ivory border text-sm font-light text-charcoal placeholder:text-charcoal/30",
    "outline-none focus:border-gold transition-colors duration-200",
    err ? "border-red-300" : "border-border"
  );

const readOnlyInputCls =
  "w-full px-4 py-3 bg-white/40 border border-border text-sm font-light text-charcoal/75";

const labelCls = "block text-2xs tracking-luxury uppercase text-charcoal/50 mb-2";

export function BookingWidget({ room }: { room: Room }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { user, isLogged } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { checkIn: today, checkOut: tomorrow, guests: 2 },
  });

  const checkIn = useWatch({ control, name: "checkIn" });
  const checkOut = useWatch({ control, name: "checkOut" });
  const nights =
    checkIn && checkOut
      ? Math.max(0, differenceInDays(new Date(checkOut), new Date(checkIn)))
      : 0;
  const total = nights * room.price;

  const goToLogin = () => {
    navigate(`/connexion?redirect=/chambres/${room.slug}`);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitError("");

    if (!user) {
      goToLogin();
      return;
    }

    try {
      await createBooking({
        room_id: Number(room.id),
        room_slug: room.slug,
        check_in: data.checkIn,
        check_out: data.checkOut,
        guests: data.guests,
      });
      setSubmitted(true);
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : "Impossible d'envoyer la demande");
    }
  };

  return (
    <div className="border border-border p-6 lg:p-8 bg-ivory sticky top-32">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-12 h-12 border border-gold flex items-center justify-center mx-auto mb-6">
              <span className="text-gold text-xl">OK</span>
            </div>
            <h3 className="font-serif text-2xl font-light text-charcoal mb-3">Demande envoyee</h3>
            <p className="text-sm font-light text-charcoal/50 leading-relaxed">
              Votre reservation est enregistree et apparaitra dans votre espace client.
            </p>
            <button
              onClick={() => navigate("/mon-espace")}
              className="mt-8 text-xs font-light text-gold underline hover:text-gold-400 transition-colors"
            >
              Voir mon historique
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <div className="pb-5 border-b border-border">
              <p className="text-2xs tracking-luxury uppercase text-gold mb-1">A partir de</p>
              <p className="font-serif text-3xl font-light text-charcoal">
                {formatPrice(room.price)}
                <span className="text-sm text-charcoal/40 font-sans font-light ml-2">/ nuit</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Arrivee</label>
                <input type="date" min={today} {...register("checkIn")} className={inputCls(!!errors.checkIn)} />
                {errors.checkIn && <p className="text-2xs text-red-500 mt-1">{errors.checkIn.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Depart</label>
                <input
                  type="date"
                  min={checkIn || tomorrow}
                  {...register("checkOut")}
                  className={inputCls(!!errors.checkOut)}
                />
                {errors.checkOut && <p className="text-2xs text-red-500 mt-1">{errors.checkOut.message}</p>}
              </div>
            </div>

            <div>
              <label className={labelCls}>Voyageurs</label>
              <select {...register("guests", { valueAsNumber: true })} className={inputCls(!!errors.guests)}>
                {Array.from({ length: room.maxGuests }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "personne" : "personnes"}
                  </option>
                ))}
              </select>
            </div>

            {nights > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-surface p-4 space-y-2 overflow-hidden"
              >
                <div className="flex justify-between text-sm font-light text-charcoal/70">
                  <span>
                    {formatPrice(room.price)} x {nights} nuit{nights > 1 ? "s" : ""}
                  </span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-xs font-light text-charcoal/40 border-t border-border pt-2">
                  <span>Taxes et frais</span>
                  <span>Inclus</span>
                </div>
                <div className="flex justify-between font-serif text-lg font-light text-charcoal border-t border-border pt-2">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </motion.div>
            )}

            <div className="border-t border-border pt-4">
              <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-4">Vos informations</p>
              {isLogged && user ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={user.first_name} readOnly className={readOnlyInputCls} />
                    <input value={user.last_name} readOnly className={readOnlyInputCls} />
                  </div>
                  <input type="email" value={user.email} readOnly className={readOnlyInputCls} />
                  <p className="text-2xs text-charcoal/40 font-light">
                    Les informations de votre compte seront utilisees automatiquement.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-light text-charcoal/55 leading-relaxed">
                    Pour reserver, vous devez d'abord creer un compte ou vous connecter.
                  </p>
                  <button
                    type="button"
                    onClick={goToLogin}
                    className="w-full py-4 border border-charcoal text-charcoal text-sm font-light tracking-wide hover:bg-charcoal hover:text-ivory transition-all duration-300"
                  >
                    Creer un compte / Se connecter
                  </button>
                </div>
              )}
            </div>

            {submitError && <p className="text-sm font-light text-red-500">{submitError}</p>}

            {isLogged ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full py-4 bg-gold text-charcoal text-sm font-light tracking-wide",
                  "hover:bg-gold-400 transition-all duration-300",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isSubmitting ? "Envoi en cours..." : "Demander a reserver"}
              </button>
            ) : null}

            <p className="text-2xs text-charcoal/40 text-center font-light leading-relaxed">
              Aucun paiement immediat. Notre equipe confirmera sous 2h.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
