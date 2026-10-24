"use client"
import Image from "next/image"
import Link from "next/link"

export function RecentLoginQuickActions() {
  const actions = [
      {
        title: "Create a Quiz",
        bgColor: "bg-[#FFECEC]",
        buttonColor: "bg-[#DF6647]",
        image: "/images/question-paper.svg",
        href: "/quiz",
      },
      {
        title: "Create Lesson Plan",
        bgColor: "bg-[#E6FFFE]",
        buttonColor: "bg-[#DF6647]",
        image: "/images/lesson-plan.svg",
        href: "/lesson-plan",
      },
    {
      title: "Create Assessments",
      bgColor: "bg-[#FFFCE1]",
      buttonColor: "bg-[#DF6647]",
      image: "/images/question-paper-2.svg",
      href: "/assessments",
    },
  ]

  return (
    <section className="mt-2">
      <h2 className="text-base font-semibold mb-2 text-[#353535]">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 w-full max-w-full mt-12">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={`relative ${action.bgColor} border border-[#F0EAFA] rounded-2xl sm:rounded-3xl p-4 sm:p-6 min-h-[180px] sm:min-h-[200px] flex flex-col items-center justify-end overflow-hidden transition-all duration-300 hover:shadow-lg group min-w-0 block`}
          >
            <div className="flex items-center justify-center w-full flex-1 min-h-0 mb-2">
              <Image 
                src={action.image} 
                alt={action.title}
                width={180}
                height={200}
                className="object-contain h-32 sm:h-48"
              />
            </div>
            <span
              className={`relative z-10 w-full ${action.buttonColor} text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg hover:opacity-90 transition-opacity group-hover:bg-[#DF6647]/95 block text-center text-xs sm:text-sm min-w-0`}
            >
              {action.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
