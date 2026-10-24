import CoreFeatures from "@/features/hero/core-features";
import GotEasier from "@/features/hero/got-easier-section";
import HeroFAQ from "@/features/hero/hero-faq";
import HeroMain from "@/features/hero/hero-main";
import HeroVideo from "@/features/hero/hero-video";
import LessonPlans from "@/features/hero/lesson-plans";
import Stories from "@/features/hero/stories";
import Working from "@/features/hero/working";

export default function Dashboard() {
  return (
    <div className="w-full flex flex-col gap-4 md:gap-6 lg:gap-8">
      <HeroMain />
      <HeroVideo/>
      <Working />
      <GotEasier/>
      <CoreFeatures/>
      <LessonPlans/>
      <Stories/>
      <HeroFAQ/>
    </div>
  )
}