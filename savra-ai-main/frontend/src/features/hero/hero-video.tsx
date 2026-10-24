import { Button } from "@/components/ui/button";

export default function HeroVideo() {
    return (
        <section 
            className="relative w-full overflow-hidden"
            style={{
                backgroundImage: 'url(/bg-dots.svg)',
                backgroundRepeat: 'repeat',
                backgroundPosition: 'center'
            }}
        >
            <div className="relative lg:-mt-28 w-full">
                {/* Video Background */}
                <video 
                    src="/video.mp4" 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                    className="w-full h-full object-cover"
                />
                
                {/* Overlay Content - Text and Button */}
                <div className="absolute inset-0 flex flex-col items-center justify-start lg:justify-center px-4 md:px-8 lg:px-20 pt-0 pb-6 md:pb-8 lg:pb-12">
                    <div className="max-w-7xl mx-auto w-full mt-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-6 items-start lg:items-center">
                            {/* Left Section - Text and Button */}
                            <div className="flex flex-col items-start justify-center lg:items-center">
                                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight mb-3 md:mb-4 max-w-2xl text-center">
                                    <span className="bg-gradient-to-b from-[#000000] to-[#001354] text-transparent bg-clip-text">One platform for all</span><br />
                                    <span className="bg-gradient-to-b from-[#000000] to-[#001354] text-transparent bg-clip-text">teacher tasks and every</span><br />
                                    <span className="bg-gradient-to-b from-[#000000] to-[#001354] text-transparent bg-clip-text">student's success.</span>
                                </h1>
                                <a 
                                    href="https://calendly.com/connectwithsuvansh/30min" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    <Button className="bg-[#333333] text-white rounded-xl px-8 py-4 md:px-10 md:py-6 text-base md:text-lg font-medium hover:bg-[#2a2a2a] transition-colors">
                                        Request A Demo
                                    </Button>
                                </a>
                            </div>
                            
                            {/* Right Section - Empty for spacing */}
                            <div className="hidden lg:block"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}