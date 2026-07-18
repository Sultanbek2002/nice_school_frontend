"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderType } from "@/app/types/menu";

const MobileHeaderLink: React.FC<{ item: HeaderType }> = ({ item }) => {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const path = usePathname();

  const isActive =
    path === item.href ||
    (item.submenu?.some(sub => path === sub.href) ?? false);

  const handleToggle = () => {
    setSubmenuOpen(!submenuOpen);
  };

  return (
    <div className="relative w-full">
      <Link
        href={item.href}
        onClick={item.submenu ? handleToggle : undefined}
        className={`flex items-center justify-between w-full py-2.5 px-3 rounded-xl font-medium transition-colors duration-200 ${
          isActive
            ? "bg-primary/10 text-primary font-semibold"
            : "text-black hover:text-primary hover:bg-primary/5"
        }`}
      >
        <span className="flex items-center gap-2">
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
          )}
          {item.label}
        </span>
        {item.submenu && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1.5em"
            height="1.5em"
            viewBox="0 0 24 24"
            className={`transition-transform duration-200 ${submenuOpen ? "rotate-180" : ""}`}
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="m7 10l5 5l5-5"
            />
          </svg>
        )}
      </Link>

      {submenuOpen && item.submenu && (
        <div className="mt-1 ml-4 space-y-1">
          {item.submenu.map((subItem, index) => {
            const isSubActive = path === subItem.href;
            return (
              <Link
                key={index}
                href={subItem.href}
                className={`block py-2 px-3 rounded-lg text-sm transition-colors duration-200 ${
                  isSubActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-grey hover:text-primary hover:bg-primary/5"
                }`}
              >
                {subItem.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MobileHeaderLink;
