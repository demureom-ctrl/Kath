// ==========================================
// Header Component - Light Theme
// ==========================================

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 bg-gradient-to-b from-white via-white to-transparent pb-4">
            <div className="px-4 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-sm text-gray-500 mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Logo / Brand */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#556c33] to-[#3e4f24] flex items-center justify-center shadow-lg">
                        <span className="text-xl">☕</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
