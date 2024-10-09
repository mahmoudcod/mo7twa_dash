'use client'
import React from "react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { FaChartSimple } from "react-icons/fa6";
import { IoIosLogOut, IoIosMenu, IoIosPerson } from "react-icons/io";
import { useAuth } from "@/app/auth";

export default function Nave() {
    const pathname = usePathname();
    const { logout } = useAuth();

    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const handleSidebarToggle = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="dashboard">
            <button className="sidebar-toggle" onClick={handleSidebarToggle}>
                {isSidebarOpen ? <IoIosMenu /> : <IoIosMenu />}
            </button>

            <nav className={`dashboard-nav ${isSidebarOpen ? 'open' : ''}`}>
                <div className="dash-logo">
                    <img src="/logo4.png" />
                </div>

                <div className="dash-links">
                    <div className={pathname === '/dashboard/pages' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/pages'} ><FaChartSimple className={pathname === '/dashboard/pages' ? 'icon act' : 'icon'} />صفحات </Link>
                    </div>

                    <div className={pathname === '/dashboard/users' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/users'} ><IoIosPerson className={pathname === '/dashboard/users' ? 'icon act' : 'icon'} />المستخدمين </Link>
                    </div>


                    <div className={'dash-link'} >
                        <IoIosLogOut className={'icon'} />
                        <a href="" onClick={handleLogout}>تسجيل خروج</a>
                    </div>
                </div>
            </nav>
        </div>
    );
}
