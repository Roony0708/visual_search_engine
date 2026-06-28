"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  ImageIcon,
  Zap,
  Shield,
  BarChart3,
  Layers,
  ArrowRight,
  Star,
} from "lucide-react";
import { UploadArea } from "@/components/upload-area";

const stats = [
  { value: "99.9%", label: "Accuracy" },
  { value: "<100ms", label: "Search Speed" },
  { value: "1M+", label: "Products Indexed" },
  { value: "50K+", label: "Daily Searches" },
];

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Results in milliseconds with FAISS vector search.",
  },
  {
    icon: ImageIcon,
    title: "AI-Powered",
    description: "Powered by OpenAI CLIP vision-language model.",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    description: "Images processed securely, no data stored.",
  },
  {
    icon: BarChart3,
    title: "Smart Ranking",
    description: "Results ranked by visual similarity score.",
  },
  {
    icon: Layers,
    title: "Batch Processing",
    description: "Handle thousands of products simultaneously.",
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "E-commerce Director",
    content:
      "This visual search engine transformed how customers find products on our site. Conversion rates increased by 35%.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "UX Designer",
    content:
      "The accuracy is remarkable. Our users love being able to search by image instead of struggling with keywords.",
    rating: 5,
  },
  {
    name: "Elena Rodriguez",
    role: "Tech Lead",
    content:
      "Clean architecture and excellent API design. We integrated it into our platform in under a day.",
    rating: 5,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleImageSelected = (file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("top_k", "20");

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/search`, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        const history = JSON.parse(localStorage.getItem("search-history") || "[]");
        history.unshift({
          id: crypto.randomUUID(),
          query_image: data.query_image,
          timestamp: Date.now(),
          result_count: data.matches.length,
        });
        localStorage.setItem("search-history", JSON.stringify(history.slice(0, 50)));

        const encoded = btoa(JSON.stringify(data));
        router.push(`/search?data=${encoded}`);
      })
      .catch(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden px-4 pb-16 pt-20 md:pb-24 md:pt-28">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.03] dark:opacity-[0.05]" />
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[600px] w-[600px] rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent blur-3xl" />
        </div>

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm"
            >
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span>AI-Powered Visual Search Technology</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Find Products Using
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {" "}Images
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
            >
              Upload any image and instantly discover visually similar products
              using AI-powered visual search. Powered by CLIP and FAISS.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mx-auto mt-12 max-w-xl"
          >
            <UploadArea
              onImageSelected={handleImageSelected}
              isLoading={isLoading}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border bg-card/50 p-4 text-center backdrop-blur-sm"
              >
                <div className="text-2xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-20 md:py-28">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold md:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to find visually similar products.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Upload Image",
                desc: "Drag and drop or browse to upload any product image.",
              },
              {
                step: "02",
                title: "AI Analysis",
                desc: "CLIP model generates a unique embedding of your image.",
              },
              {
                step: "03",
                title: "Get Results",
                desc: "FAISS finds the most visually similar products instantly.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-xl border bg-card p-8 text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <span className="text-2xl font-bold">{item.step}</span>
                </div>
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t py-20 md:py-28">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold md:text-4xl">
              Powerful Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need for visual product discovery.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-20 md:py-28">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold md:text-4xl">
              Loved by Teams
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Hear from our users about their experience.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border bg-card p-6"
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-yellow-500 text-yellow-500"
                    />
                  ))}
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t py-20 md:py-28">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold md:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Upload an image above and discover visually similar products
              instantly.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-8"
            >
              <UploadArea onImageSelected={handleImageSelected} />
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
