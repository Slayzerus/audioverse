const navItems = ["parties", "players", "songs", "studio", "settings"];
let activeIndex = 0;

export const handleControlUp = () => {
    console.log("Up pressed");
};

export const handleControlDown = () => {
    console.log("Down pressed");
};

export const handleControlLeft = (setActiveNavItem: (item: string) => void) => {
    activeIndex = (activeIndex - 1 + navItems.length) % navItems.length;
    setActiveNavItem(navItems[activeIndex]);
};

export const handleControlRight = (setActiveNavItem: (item: string) => void) => {
    activeIndex = (activeIndex + 1) % navItems.length;
    setActiveNavItem(navItems[activeIndex]);
};
