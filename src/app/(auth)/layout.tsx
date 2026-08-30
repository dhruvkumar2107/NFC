export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gray-50">
      <div className="gradient-mesh absolute inset-0" />

      <div className="absolute top-[-12%] left-[-8%] w-[500px] h-[500px] rounded-full bg-primary-400/20 blur-[120px] animate-pulse-soft" />
      <div className="absolute bottom-[-10%] right-[-6%] w-[450px] h-[450px] rounded-full bg-purple-400/15 blur-[100px] animate-pulse-soft" style={{ animationDelay: "2s" }} />
      <div className="absolute top-[40%] right-[15%] w-[300px] h-[300px] rounded-full bg-sky-300/10 blur-[80px] animate-float-slow" />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {children}
      </div>
    </div>
  )
}
