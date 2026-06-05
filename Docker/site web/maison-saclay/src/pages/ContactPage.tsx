import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { PageHero } from "@/components/sections/PageHero";
import { cn } from "@/lib/utils";
import { IMAGES } from "@/data/images";
import { useAuth } from "@/lib/auth-context";
import { createContact } from "@/services/api";

const schema = z.object({
  phone: z.string().optional(),
  subject: z.string().min(1, "Veuillez choisir un sujet"),
  message: z.string().min(20, "Message trop court (20 caracteres minimum)"),
});

type FormData = z.infer<typeof schema>;

const subjects = [
  "Reservation chambre",
  "Reservation restaurant",
  "Reservation spa",
  "Evenement prive / seminaire",
  "Autre demande",
];

const infos = [
  {
    Icon: MapPin,
    label: "Adresse",
    lines: ["1 Allee du Plateau", "91400 Saclay, Ile-de-France", "A 25 min de Paris (RER B + navette)"],
  },
  {
    Icon: Phone,
    label: "Telephone",
    lines: ["+33 1 69 00 00 00"],
    href: "tel:+33169000000",
  },
  {
    Icon: Mail,
    label: "Email",
    lines: ["contact@maison-saclay.fr"],
    href: "mailto:contact@maison-saclay.fr",
  },
  {
    Icon: Clock,
    label: "Reception",
    lines: ["Ouverte 24h/24 - 7j/7", "Check-in : 15h00", "Check-out : 12h00"],
  },
];

const inputCls = (err: boolean) =>
  cn(
    "w-full px-4 py-3 bg-ivory border text-sm font-light text-charcoal placeholder:text-charcoal/30",
    "outline-none focus:border-gold transition-colors duration-200",
    err ? "border-red-300" : "border-border"
  );

const readOnlyInputCls =
  "w-full px-4 py-3 bg-white/40 border border-border text-sm font-light text-charcoal/75";

const labelCls = "block text-2xs tracking-luxury uppercase text-charcoal/50 mb-2";

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const { user, isLogged } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const goToLogin = () => navigate("/connexion?redirect=/contact");

  const onSubmit = async (data: FormData) => {
    await createContact({
      phone: data.phone,
      subject: data.subject,
      message: data.message,
    });
    setSubmitted(true);
  };

  return (
    <>
      <SEO
        title="Contact"
        description="Contactez Maison Saclay pour toute demande de reservation, evenement prive ou information."
      />

      <PageHero
        label="Nous contacter"
        title="A votre"
        titleItalic="service"
        subtitle="Notre equipe est disponible 24h/24 pour repondre a toutes vos demandes."
        image={IMAGES.rooftop.sunset}
        size="sm"
      />

      <section className="py-section bg-ivory">
        <div className="max-w-8xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-1 space-y-10"
            >
              <div>
                <p className="text-2xs tracking-luxury uppercase text-gold mb-4">Maison Saclay</p>
                <h2 className="text-display-md font-serif font-light text-charcoal leading-tight">
                  Parlons de
                  <br />
                  <em className="italic">votre sejour</em>
                </h2>
              </div>

              <div className="space-y-8">
                {infos.map(({ Icon, label, lines, href }) => (
                  <div key={label} className="flex gap-4">
                    <div className="w-8 h-8 border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={13} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-2">{label}</p>
                      {lines.map((line, i) =>
                        href && i === 0 ? (
                          <a
                            key={line}
                            href={href}
                            className="block text-sm font-light text-charcoal/70 hover:text-charcoal transition-colors duration-200"
                          >
                            {line}
                          </a>
                        ) : (
                          <p key={line} className="text-sm font-light text-charcoal/70">
                            {line}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="aspect-[4/3] overflow-hidden border border-border bg-surface flex items-center justify-center">
                <div className="text-center">
                  <MapPin size={24} className="text-gold mx-auto mb-3" />
                  <p className="text-xs font-light text-charcoal/40">1 Allee du Plateau</p>
                  <p className="text-xs font-light text-charcoal/40">91400 Saclay</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-2"
            >
              <div className="border border-border p-8 lg:p-12">
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-16"
                    >
                      <div className="w-16 h-16 border border-gold flex items-center justify-center mx-auto mb-8">
                        <span className="text-gold text-2xl">OK</span>
                      </div>
                      <h3 className="font-serif text-3xl font-light text-charcoal mb-4">Message envoye</h3>
                      <p className="text-base font-light text-charcoal/50 leading-relaxed max-w-sm mx-auto">
                        Merci pour votre message. Notre equipe vous repondra dans les 2 heures.
                      </p>
                      <button
                        onClick={() => setSubmitted(false)}
                        className="mt-10 text-sm font-light text-gold underline hover:text-gold-400 transition-colors"
                      >
                        Envoyer un autre message
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onSubmit={handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      <div>
                        <p className="text-2xs tracking-luxury uppercase text-gold mb-6">Votre message</p>
                      </div>

                      {isLogged && user ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className={labelCls}>Prenom</label>
                              <input value={user.first_name} readOnly className={readOnlyInputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Nom</label>
                              <input value={user.last_name} readOnly className={readOnlyInputCls} />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className={labelCls}>Email</label>
                              <input type="email" value={user.email} readOnly className={readOnlyInputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>
                                Telephone <span className="text-charcoal/30 normal-case tracking-normal">(optionnel)</span>
                              </label>
                              <input
                                type="tel"
                                placeholder="+33 6 00 00 00 00"
                                {...register("phone")}
                                className={inputCls(false)}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={labelCls}>Sujet</label>
                            <select {...register("subject")} className={inputCls(!!errors.subject)}>
                              <option value="">Choisir un sujet...</option>
                              {subjects.map((subject) => (
                                <option key={subject} value={subject}>
                                  {subject}
                                </option>
                              ))}
                            </select>
                            {errors.subject && <p className="text-2xs text-red-500 mt-1">{errors.subject.message}</p>}
                          </div>

                          <div>
                            <label className={labelCls}>Message</label>
                            <textarea
                              rows={6}
                              placeholder="Decrivez votre demande en detail..."
                              {...register("message")}
                              className={cn(inputCls(!!errors.message), "resize-none")}
                            />
                            {errors.message && <p className="text-2xs text-red-500 mt-1">{errors.message.message}</p>}
                          </div>

                          <p className="text-2xs text-charcoal/40 font-light">
                            Les informations de votre compte seront utilisees automatiquement.
                          </p>

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className={cn(
                              "w-full py-4 bg-gold text-charcoal text-sm font-light tracking-wide",
                              "hover:bg-gold-400 transition-all duration-300",
                              "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                          >
                            {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                          </button>
                        </>
                      ) : (
                        <div className="space-y-5">
                          <p className="text-sm font-light text-charcoal/55 leading-relaxed">
                            Pour contacter l'hotel et recevoir une reponse dans votre espace client, vous devez d'abord
                            creer un compte ou vous connecter.
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

                      <p className="text-2xs text-charcoal/40 text-center font-light">
                        Reponse garantie sous 2h - Lundi au dimanche, 8h - 22h
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
