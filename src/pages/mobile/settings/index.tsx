/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import PageHeader from "@/components/mobile/PageHeader";
import BottomNavbar from "@/components/mobile/BottomNavbar";
import InventoryMenuCard from "@/components/mobile/inventory/InventoryMenuCard";

import {
    MoveRight,
    Barcode,
    ClipboardList,
    SlidersHorizontal,
    Repeat,
    History,
    FileText,
    ScanBarcode,
    SearchCheck,
    SearchCheckIcon,
    SearchXIcon,
    Search,
    LocateFixedIcon,
    FileQuestion,
    LocateIcon,
    MailQuestion,
    BoxSelect,
    BadgeXIcon,
    ScalingIcon,
    ScanBarcodeIcon,
    PlusIcon,
    PlusSquare,
    Music,
} from "lucide-react";

const inventoryMenus = [
    {
        label: "Sound Settings",
        icon: <Music />,
        href: "/mobile/settings/sound-settings",
    },
    // {
    //     label: "Add Location",
    //     icon: <PlusIcon />,
    //     href: "/mobile/utility/add-location",
    // },
    // {
    //     label: "Add Container",
    //     icon: <BoxSelect />,
    //     href: "/mobile/utility/add-container",
    // }
];

export default function SettingMenuPage() {
    return (
        <>
            <PageHeader title="Utility" showBackButton />
            <div className="min-h-screen bg-gray-50 px-4 pt-4 pb-20 max-w-md mx-auto">
                <div className="space-y-3">
                    {inventoryMenus.map((menu, idx) => (
                        <InventoryMenuCard
                            key={idx}
                            icon={menu.icon}
                            label={menu.label}
                            href={menu.href}
                        />
                    ))}
                </div>
                <BottomNavbar />
            </div>
        </>
    );
}
