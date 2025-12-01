"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductCatalog } from "@/features/product-catalog/hooks/use-product-catalog";
import {
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Mail,
  MapPin,
  Pill,
  ShieldCheck,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

// Mock data
const TESTIMONIALS = [
  {
    name: "John Doe",
    text: "Mojo transformed my life and gave me back my confidence!",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    title: "CEO, 35Y",
  },
  {
    name: "Mike Smith",
    text: "The service is quick and discreet, just what I needed!",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    title: "MANAGER, 46Y",
  },
  {
    name: "James Wilson",
    text: "The service is quick and discreet, just what I needed!",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/57.jpg",
    title: "CEO, 35Y",
  },
] as const;

const FAQS = [
  {
    q: "Are your supplements FDA approved?",
    a: "All our supplements are manufactured in FDA-registered facilities following strict quality standards.",
  },
  {
    q: "How fast is shipping?",
    a: "We offer free 2-day shipping on all orders. Your products arrive quickly and discreetly.",
  },
  {
    q: "Can I take these with my medications?",
    a: "Please consult your healthcare provider before starting any new supplement, especially if you are on medication.",
  },
  {
    q: "Do you offer subscriptions?",
    a: "Yes! Subscribe and save 10% on every order. Cancel anytime.",
  },
] as const;

const PROCESS_STEPS = [
  {
    icon: <ClipboardList className="w-8 h-8 mx-auto text-blue-500" />,
    title: "3-Minute Health Quiz",
    desc: "Complete our simple online questionnaire about your health history and goals.",
    badge: "STEP 1",
  },
  {
    icon: <ShieldCheck className="w-8 h-8 mx-auto text-blue-500" />,
    title: "Expert Review",
    desc: "A licensed provider will review your profile and approve supplement options.",
    badge: "STEP 2",
  },
  {
    icon: <Truck className="w-8 h-8 mx-auto text-blue-500" />,
    title: "Fast and Discreet Delivery",
    desc: "Receive your personalized plan discreetly and directly to your door within 2 business days.",
    badge: "STEP 3",
  },
] as const;

export function Storefront() {
  const filters = useMemo(() => ({}), []);
  const { products } = useProductCatalog({ filters });

  const [newsletter, setNewsletter] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [productIndex, setProductIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  // Use fetched products for carousel
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#181c2a] via-[#232a47] to-[#e6f0ff]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pb-32 pt-16 md:pt-24">
        <div className="absolute inset-0 z-0 bg-gradient-to-tr from-[#181c2a] via-[#232a47] to-[#1e3a8a] opacity-90" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-white md:pt-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Better Health,
              <br />
              Peak Performance
            </h1>
            <p className="text-lg md:text-xl mb-6 max-w-lg">
              Fast, discreet, and effective solutions for better health
              delivered right to your door. No waiting rooms. No awkward
              conversations. We combine personalized supplement options with
              unmatched convenience.
            </p>
            <Button
              size="lg"
              className="bg-background text-foreground font-semibold px-8 py-4 text-lg shadow-md hover:bg-accent"
              onClick={() => router.push("/auth")}
            >
              <span>Start Now</span>
            </Button>
          </div>
          <div className="flex-1 flex justify-center items-center">
            {/* Mock product image */}
            <div className="w-72 h-56 bg-gradient-to-tr from-blue-500 to-blue-400 rounded-2xl shadow-xl flex items-center justify-center relative">
              <Pill className="w-24 h-24 text-white opacity-80" />
              <span className="absolute bottom-4 right-4 text-white font-bold text-lg">
                Supplements
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="relative z-20 max-w-5xl mx-auto px-4 -mt-16">
        <div className="bg-card rounded-3xl shadow-xl p-8 flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Your journey to <span className="text-blue-500">better health</span>
            <br />
            <span className="text-blue-500">starts here</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full mb-8">
            {[
              {
                icon: <MapPin className="w-12 h-12 text-blue-200" />,
                title: "FDA APPROVED TREATMENTS",
                subtitle: "MADE IN THE U.S.A.",
              },
              {
                icon: <Zap className="w-12 h-12 text-blue-200" />,
                title: "FAST APPROVAL",
                subtitle: "AND DELIVERY",
              },
              {
                icon: <ClipboardList className="w-12 h-12 text-blue-200" />,
                title: "PERSONALIZED TREATMENT",
                subtitle: "OPTIONS",
              },
              {
                icon: <Pill className="w-12 h-12 text-blue-200" />,
                title: "TARGETED",
                subtitle: "FAST ACTION PRODUCTS",
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="bg-blue-500/10 rounded-full p-6 mb-4">
                  {item.icon}
                </div>
                <div className="font-bold text-sm tracking-wider mb-1">
                  {item.title}
                </div>
                <div className="text-sm tracking-wider">{item.subtitle}</div>
              </div>
            ))}
          </div>
          <Button
            className="bg-[#181c2a] text-white pl-10 pr-8 py-6 rounded-full font-semibold text-lg hover:bg-[#232a47] flex items-center"
            onClick={() => router.push("/auth")}
          >
            <span className="pl-[1px]">Get Started</span>{" "}
            <ArrowRight className="w-5 h-5 ml-3" />
          </Button>
        </div>
      </section>

      {/* Product Carousel */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 mb-12">
          <div className="flex items-center justify-between">
            <div>
              <span className="uppercase tracking-widest text-blue-500 font-bold text-sm">
                PRODUCTS
              </span>
              <h2 className="text-2xl md:text-3xl font-bold mt-2 text-white">
                Explore our range of health solutions
              </h2>
            </div>
            <Button className="bg-[#181c2a] text-white pl-10 pr-8 py-6 rounded-full font-semibold text-lg hover:bg-[#232a47] flex items-center">
              View All <ArrowRight className="w-5 h-5 ml-3" />
            </Button>
          </div>
        </div>

        <div className="relative w-full overflow-hidden">
          <div className="max-w-[90rem] mx-auto px-4">
            <div
              className="flex transition-transform duration-300 gap-6"
              style={{
                transform: `translateX(calc(-${productIndex * 100}% - ${productIndex * 1.5}rem))`,
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id || product.name}
                  className="w-[640px] flex-shrink-0"
                >
                  <div className="h-[320px] bg-blue-500/10 rounded-3xl p-10 flex flex-col justify-center relative overflow-hidden">
                    <div className="max-w-[60%] relative z-10">
                      <h3 className="text-2xl font-semibold mb-4">
                        {product.name}
                      </h3>
                      <div
                        className="text-muted-foreground text-base mb-4 leading-relaxed prose prose-sm max-w-none [&>*]:text-muted-foreground [&>*]:text-base [&>*]:leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: product.description || "",
                        }}
                      />
                      {/* Benefits field removed - now managed by Stripe product details */}
                    </div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4">
                      <Pill className="w-48 h-48 text-blue-500/20 rotate-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {productIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-8 top-1/2 -translate-y-1/2 z-10"
              onClick={() => setProductIndex(productIndex - 1)}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </Button>
          )}

          {productIndex < products.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-8 top-1/2 -translate-y-1/2 z-10"
              onClick={() => setProductIndex(productIndex + 1)}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </Button>
          )}
        </div>

        <div className="flex justify-center mt-8 gap-2">
          {products.map((_, i) => (
            <button
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${productIndex === i ? "bg-blue-500 w-4" : "bg-blue-500/30"}`}
              onClick={() => setProductIndex(i)}
            />
          ))}
        </div>
      </section>

      {/* Process Steps (again, for visual separation) */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-white">
          Easy Process. Enhanced Performance.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PROCESS_STEPS.map((step, i) => (
            <div
              key={i}
              className={`rounded-2xl p-8 shadow-lg bg-gradient-to-br ${i === 0 ? "from-blue-500/10 to-background" : i === 1 ? "from-orange-500/10 to-background" : "from-muted to-background"}`}
            >
              <span className="text-xs font-bold text-blue-500 mb-1 block">
                {step.badge}
              </span>
              {step.icon}
              <div className="font-semibold mt-2 mb-1 text-lg">
                {step.title}
              </div>
              <div className="text-muted-foreground text-sm">{step.desc}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-8">
          <Button
            size="lg"
            className="bg-white text-[#181c2a] font-semibold px-8 py-4 text-lg shadow-md hover:bg-gray-100"
            onClick={() => router.push("/auth")}
          >
            <span>Get Started</span>
          </Button>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e1b4b] via-[#3b82f6] to-[#991b1b] opacity-90" />
        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <span className="block text-center text-white uppercase font-bold tracking-[0.2em] mb-4 text-3xl">
            testimonials
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center text-white uppercase max-w-5xl mx-auto leading-tight">
            join thousands of men who have discovered a better way to enhance
            their performance and regain their confidence
          </h2>
          <div className="relative w-full overflow-hidden">
            <div className="w-full px-4">
              <div
                className="flex transition-transform duration-300 gap-6"
                style={{
                  transform: `translateX(calc(-${testimonialIndex * 100}% - ${testimonialIndex * 1.5}rem))`,
                }}
              >
                {TESTIMONIALS.map((t, i) => (
                  <div
                    key={i}
                    className="max-w-full w-full sm:w-[640px] h-[320px] flex-shrink-0"
                  >
                    <div className="h-full bg-background/5 backdrop-blur rounded-3xl p-8 flex flex-col justify-between border border-border/10">
                      <div className="flex items-center gap-1 mb-6">
                        {[...Array(t.rating)].map((_, idx) => (
                          <Star
                            key={idx}
                            className="w-5 h-5 text-blue-500 fill-blue-500"
                          />
                        ))}
                      </div>
                      <div className="text-xl font-medium mb-8 text-white flex-1">
                        &quot;{t.text}&quot;
                      </div>
                      <div className="flex items-center gap-4 mt-auto">
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <div className="font-medium text-white">{t.name}</div>
                          <div className="text-sm text-muted-foreground/80">
                            {t.title}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {testimonialIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-8 top-1/2 -translate-y-1/2 bg-[#181c2a] hover:bg-[#232a47] rounded-full w-12 h-12 flex items-center justify-center z-10"
                onClick={() => setTestimonialIndex(testimonialIndex - 1)}
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </Button>
            )}

            {testimonialIndex < TESTIMONIALS.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-8 top-1/2 -translate-y-1/2 bg-[#181c2a] hover:bg-[#232a47] rounded-full w-12 h-12 flex items-center justify-center z-10"
                onClick={() => setTestimonialIndex(testimonialIndex + 1)}
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </Button>
            )}
          </div>

          <div className="flex justify-center mt-8 gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${testimonialIndex === i ? "bg-blue-500 w-4" : "bg-background/20"}`}
                onClick={() => setTestimonialIndex(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-blue-500/5 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-[#181c2a]">
            Common questions about our services and products
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem value={faq.q} key={i}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contact/CTA Section */}
      <section className="bg-gradient-to-tr from-[#181c2a] via-[#232a47] to-[#1e3a8a] py-16">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Ready to get your health back?
            </h2>
            <p className="mb-4">
              Don&apos;t wait to achieve your wellness goals. Sign up for a
              personalized consultation today and discover effective solutions
              tailored just for you.
            </p>
            <Button
              size="lg"
              className="bg-background text-foreground font-semibold px-8 py-4 text-lg shadow-md hover:bg-accent"
              onClick={() => router.push("/auth")}
            >
              Get Started
            </Button>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <div className="w-40 h-40 bg-blue-500/20 rounded-2xl flex items-center justify-center">
              <Pill className="w-24 h-24 text-blue-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold mb-2">Stay Updated</h2>
        <p className="text-muted-foreground mb-4">
          Join our newsletter for exclusive updates and offers!
        </p>
        {newsletterSuccess ? (
          <div className="text-green-600 font-medium flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" /> Thank you for subscribing!
          </div>
        ) : (
          <form
            className="flex flex-col sm:flex-row gap-2 justify-center"
            onSubmit={(e) => {
              e.preventDefault();
              setNewsletterSuccess(true);
            }}
          >
            <Input
              type="email"
              placeholder="Your email address"
              value={newsletter}
              onChange={(e) => setNewsletter(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" variant="default">
              <Mail className="w-4 h-4" /> Subscribe
            </Button>
          </form>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-[#181c2a] py-8 text-center text-muted-foreground/70 text-sm">
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a href="#" className="hover:underline">
            Privacy Policy
          </a>
          <a href="#" className="hover:underline">
            Terms of Use
          </a>
          <a href="#" className="hover:underline">
            Contact
          </a>
        </div>
        <div className="mt-2">
          © {new Date().getFullYear()} Your Health Store. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
