"use client"

interface StepSchoolSearchProps {
  onSelect: (school: string) => void
  value?: string
}

export function StepSchoolSearch({ onSelect, value = "" }: StepSchoolSearchProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    onSelect(name)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Enter your school name"
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#DF6647] focus:ring-2 focus:ring-[#DF6647]/20 text-[#242220] placeholder-gray-400 transition-colors"
      />
    </div>
  )
}
