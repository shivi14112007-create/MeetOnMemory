import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
    {
        question: "Is MeetOnMemory free?",
        answer:
          "MeetOnMemory is currently under active development. During this phase, core feature are available for testing. Pricing plans will be introduced as the platform matures.",
    },
    {
        question: "Which AI model is used?",
        answer:
            "MeetOnMemory leverages modern AI models such as Google Gemini for meeting summarization and knowledge extraction. Additional AI services may be integrated as the platform evolves.",
    },
    {
        question: "Can I upload meeting recordings?",
        answer: 
           "Yes, You can upload meeting recordings, transcripts, and supporting documents. The platform processes them to generate summaries, extarct key decisions, and build searchable organizational knowledge.",
    },    
    {
        question: "How secure is my data?",
        answer:
            "Security is a priority. Authentication, protected APIs, and organization-based access controls help ensure your meeting data remains private and accessible only to authorized users.",
    },
    {
        question: "Can I search previous meetings?",
        answer:
            "Absolutely. MeetOnMemory uses AI-powered semantic search so you can ask natural language questions and quickly retrieve discussions, action items, and past decisions.",
    },
    {
        question: "What file formats are supported?",
        answer:
           "The platform is designed to support meeting recordings, transcripts, PDFs, and other commonly used meeting documents. Additional formats may be added over time.",
    },
    { 
        question: "Can multiple team members collaborate?",
        answer:
            "Yes. Organizations can collaborate in shared workspaces where members can access meetings, documents, AI summaries, and organizational knowledge together.",
    },
    {
        question: "Can I generate meeting reports?",
        answer:
             "Yes. AI-generated reports include meeting summaries, key decisions, action items, analytics, and structured Minutes of Meeting (MoM) to improve productivity.", 
    },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(-1);

  return (
    <section
      id="faq"
      className="relative overflow-hidden py-24 px-6 bg-gradient-to-b from-white via-slate-50 to-white"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
            FAQ
          </span>

          <h2 className="mt-5 text-4xl font-bold tracking-tight text-gray-900">
            Frequently Asked Questions
          </h2>

          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about MeetOnMemory, AI-powered meeting
            intelligence, collaboration, and knowledge management.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg"
              >
                <button
                  className="flex w-full items-center justify-between px-6 py-5 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-2xl"
                  onClick={() =>
                    setOpenIndex(isOpen ? -1 : index)
                  }
                  aria-expanded={isOpen}
                  aria-controls={`faq-${index}`}
                >
                  <span className="text-lg font-semibold text-gray-900">
                    {faq.question}
                  </span>

                  <ChevronDown
                    className={`h-5 w-5 text-blue-600 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  id={`faq-${index}`}
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6 text-gray-600 leading-7">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
