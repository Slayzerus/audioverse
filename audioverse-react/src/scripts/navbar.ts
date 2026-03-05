const navItems = ["parties", "players", "songs", "studio", "settings"];
let activeIndex = 0;

export const handleControlUp = () => {
};

export const handleControlDown = () => {
};

export const handleControlLeft = (setActiveNavItem: (item: string) => void) => {
    activeIndex = (activeIndex - 1 + navItems.length) % navItems.length;
    setActiveNavItem(navItems[activeIndex]);
};

export const handleControlRight = (setActiveNavItem: (item: string) => void) => {
    activeIndex = (activeIndex + 1) % navItems.length;
    setActiveNavItem(navItems[activeIndex]);
};
