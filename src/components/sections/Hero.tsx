import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ShieldCheck, Timer, Database } from "lucide-react";
import aerialPropertySite from "@/assets/aerial-property-site.jpg";
import buildsmarterLogo from "@/assets/buildsmarter-logo-new.png";

export const Hero = () => {
  return (
    <motion.section
      className="relative flex min-h-screen items-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0A0F2C 0%, #11224F 50%, rgba(255, 122, 0, 0.2) 100%)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background gradient mesh - Layer 0 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-midnight-blue/50 via-transparent to-feasibility-orange/10" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(10, 15, 44, 0.12) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, rgba(255, 122, 0, 0.10) 0%, transparent 50%),
                           radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.06) 0%, transparent 50%)`,
        }} />
      </div>

      {/* Animated parcel map - Layer 1 (Right 7 cols) */}
      <motion.div
        className="absolute right-0 top-0 h-full w-full lg:w-7/12"
        initial={{ scale: 0.9, filter: "blur(10px)", opacity: 0 }}
        animate={{ scale: 1, filter: "blur(0px)", opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="relative h-full w-full">
          <img
            src={aerialPropertySite}
            alt="Real-time feasibility data visualization"
            className="h-full w-full object-cover opacity-40"
          />
          {/* Parcel grid overlay with glow */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-data-cyan/5 to-midnight-blue/80" />
          
          {/* Animated data pings */}
          <motion.div
            className="absolute top-1/4 right-1/4 h-4 w-4 rounded-full bg-data-cyan"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ boxShadow: "0 0 20px rgba(6, 182, 212, 0.6)" }}
          />
          <motion.div
            className="absolute bottom-1/3 right-1/2 h-3 w-3 rounded-full bg-feasibility-orange"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3,
              delay: 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ boxShadow: "0 0 20px rgba(255, 122, 0, 0.6)" }}
          />
        </div>
      </motion.div>

      {/* Glass overlay card - Layer 2 (Left 5 cols) */}
      <div className="container relative z-10 mx-auto px-6 lg:px-20">
        <div className="max-w-2xl lg:w-5/12">
          {/* Logo */}
          <motion.div
            className="mb-8 lg:mb-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <img
              src={buildsmarterLogo}
              alt="BuildSmarter Feasibility"
              className="h-20 sm:h-24 lg:h-28 object-contain"
            />
          </motion.div>

          {/* Glass card for content */}
          <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/90 to-cloud-white/80 p-8 lg:p-10 backdrop-blur-xl shadow-2xl">
            {/* Eyebrow tagline with verified icon */}
            <motion.div
              className="mb-4 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <ShieldCheck className="h-4 w-4 text-data-cyan" />
              <p className="text-sm font-medium uppercase tracking-widest text-data-cyan">
                AI-Powered Development Intelligence
              </p>
            </motion.div>

            {/* H1 Headline */}
            <motion.h1
              className="mb-6 font-headline text-4xl font-bold leading-tight text-midnight-blue lg:text-5xl xl:text-6xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              10-Minute Feasibility.{" "}
              <span className="bg-gradient-to-r from-feasibility-orange to-feasibility-orange/70 bg-clip-text text-transparent">
                100% Verified Data.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="mb-8 font-body text-base leading-relaxed text-slate-gray lg:text-lg"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.9 }}
            >
              BuildSmarter™ analyzes every parcel, flood zone, and utility line in real time—transforming
              weeks of consultant work into a single automated report, trusted by lenders and developers.
            </motion.p>

            {/* CTA Group - Layer 3 */}
            <motion.div
              className="flex flex-col gap-4 sm:flex-row sm:items-center"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, delay: 1.1 }}
            >
              <Button
                variant="maxx-red"
                size="lg"
                className="group relative overflow-hidden font-cta text-lg shadow-glow transition-all duration-300 hover:shadow-2xl"
                onClick={() => (window.location.href = "/application?step=2")}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Run Free QuickCheck →
                </span>
                {/* Inner glow ripple on hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-feasibility-orange to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-30" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="group relative border-2 border-data-cyan font-cta text-lg text-data-cyan transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                <span className="flex items-center gap-2">See a Real Report</span>
                {/* Cyan edge glow expands */}
                <span className="absolute inset-0 rounded-lg border-2 border-data-cyan opacity-0 transition-all duration-300 group-hover:inset-[-2px] group-hover:opacity-100" />
              </Button>
            </motion.div>

            {/* Dataset badges - staggered animation */}
            <div className="mt-10 flex flex-wrap items-center gap-6 opacity-70 transition-opacity duration-300 hover:opacity-100">
              {[
                { name: "FEMA", delay: 0 },
                { name: "ArcGIS", delay: 0.1 },
                { name: "TxDOT", delay: 0.2 },
                { name: "EPA", delay: 0.3 },
                { name: "Census", delay: 0.4 },
              ].map((dataset, i) => (
                <motion.div
                  key={dataset.name}
                  className="flex items-center gap-2 rounded-lg border border-slate-gray/20 bg-white/50 px-3 py-1.5 backdrop-blur-sm transition-all duration-300 hover:border-data-cyan/40 hover:bg-white/80"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: 1.3 + dataset.delay,
                  }}
                >
                  <Database className="h-3 w-3 text-slate-gray" />
                  <span className="text-xs font-medium text-slate-gray">{dataset.name}</span>
                </motion.div>
              ))}
            </div>

            {/* Floating timer icon */}
            <motion.div
              className="mt-6 flex items-center gap-2 text-xs text-slate-gray/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <Timer className="h-3 w-3" />
              <span>Data-cited for lenders • 10-minute turnaround • No commitment required</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Background watermark - Database icon */}
      <Database className="absolute bottom-20 right-20 hidden h-64 w-64 text-midnight-blue opacity-5 lg:block" />
    </motion.section>
  );
};
