import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Search, BarChart3, Users, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Meeting Intelligence",
    description:
      "Automatically transcribe meetings, generate summaries, and capture action items.",
    gradient: "from-blue-600 to-violet-600",
  },
  {
    icon: Search,
    title: "Semantic Search",
    description:
      "Quickly find discussions, decisions, and information from past meetings.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: BarChart3,
    title: "Smart Reports",
    description:
      "Generate AI-powered reports and insights to support better decisions.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Collaborate with your organization in one centralized knowledge hub.",
    gradient: "from-orange-500 to-amber-500",
  },
];

const useIntersectionFade = (threshold = 0.15) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.unobserve(el);
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return ref;
};

const About = () => {
  const navigate = useNavigate();
  const headingRef = useIntersectionFade();

  return (
    <section
      id="about"
      className="py-24 bg-linear-to-b from-white to-slate-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Section Header */}
        <div
          ref={headingRef}
          className="fade-in-up text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">
            About Us
          </span>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mt-5 leading-tight">
            About{" "}
            <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              MeetOnMemory
            </span>
          </h2>

          <p className="mt-5 text-base sm:text-lg text-gray-600 leading-relaxed">
            MeetOnMemory is an AI-powered knowledge management platform that
            transforms meetings into searchable, structured knowledge. Instead
            of losing valuable discussions, teams can instantly access
            summaries, action items, and key decisions whenever they need them.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const stagger = `stagger-${Math.min(index + 1, 6)}`;
            return (
              <AboutCard
                key={index}
                Icon={Icon}
                feature={feature}
                stagger={stagger}
              />
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <button
            id="about-cta-btn"
            onClick={() => navigate("/login?mode=signup")}
            className="group inline-flex items-center gap-2 px-8 py-3.5 bg-linear-to-r from-blue-600 to-violet-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 active:scale-100 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-label="Join MeetOnMemory today"
          >
            Join MeetOnMemory Today
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </section>
  );
};

const AboutCard = ({ Icon, feature, stagger }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`fade-in-up ${stagger} group bg-white border border-gray-200 rounded-2xl p-7 shadow-sm h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200`}
    >
      <div
        className={`w-12 h-12 rounded-xl bg-linear-to-br ${feature.gradient} flex items-center justify-center text-white mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className="w-5 h-5" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
        {feature.title}
      </h3>

      <p className="text-gray-500 leading-relaxed text-center text-sm">
        {feature.description}
      </p>
    </div>
  );
};

export default About;
