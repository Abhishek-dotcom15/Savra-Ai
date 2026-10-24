"use client"
import Image from "next/image"
import Link from "next/link"

export function QuickActions() {
  const actions = [
    {
      title: "Create lesson plan",
      bgColor: "bg-[#FFFCE1]",
      buttonColor: "bg-[#DF6647]",
      image: "/images/lesson-plan.svg",
      href: "/lesson-plan",
    },
    {
      title: "Create Assessments",
      bgColor: "bg-[#FFECEC]",
      buttonColor: "bg-[#DF6647]",
      image: "/images/question-paper.svg",
      href: "/assessments",
    },
    {
      title: "Analytics",
      bgColor: "bg-[#E6FFFE]",
      buttonColor: "bg-[#DF6647]",
      image: "/images/analytics.svg",
      href: "/analytics",
    },
    {
      title: "Announcements",
      bgColor: "bg-[#E7EBFF]",
      buttonColor: "bg-[#DF6647]",
      image: "/images/announcements.svg",
      href: "/announcements",
    },
  ]

  return (
    <section className="mt-4 flex-shrink-0">
      <h2 className="text-base font-semibold mb-2 text-[#353535]">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4 w-full max-w-full">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={`relative ${action.bgColor} border border-[#F0EAFA] rounded-3xl p-4 min-h-[160px] flex flex-col items-center justify-end overflow-hidden transition-all duration-300 hover:shadow-lg group min-w-0 block`}
          >
            <div className="flex items-center justify-center w-full flex-1 min-h-0">
              <Image 
                src={action.image} 
                alt={action.title}
                width={180}
                height={200}
                className="object-contain h-34"
              />
            </div>
            <span
              className={`relative z-10 w-full ${action.buttonColor} text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity group-hover:bg-[#DF6647]/95 block text-center text-sm min-w-0`}
            >
              {action.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
