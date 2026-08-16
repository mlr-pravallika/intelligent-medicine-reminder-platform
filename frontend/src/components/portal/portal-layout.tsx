import {
  useState,
  type ReactNode,
} from "react";

import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";

import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  ClipboardList,
  Cog,
  FileScan,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Pill,
  Search,
  Settings,
  ShieldCheck,
  Siren,
  Timer,
  UserRound,
  Users,
  ChevronDown,
} from "lucide-react";

import {
  useAuth,
} from "@/hooks/useAuth";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Logo,
} from "@/components/brand/logo";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  cn,
} from "@/lib/utils";


/* ============================================================
   TYPES
============================================================ */

type NavItem = {
  label: string;
  to: string;
  icon: typeof Pill;
};

type NavGroup = {
  group: string;
  items: NavItem[];
};


/* ============================================================
   PATIENT NAVIGATION
============================================================ */

export const patientNav: NavGroup[] = [
  {
    group: "Overview",
    items: [
      {
        label: "Dashboard",
        to: "/patient",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    group: "Medication",
    items: [
      {
        label: "My Medicines",
        to: "/patient/medicines",
        icon: Pill,
      },
      {
        label: "Add Medicine",
        to: "/patient/medicines/add",
        icon: ClipboardList,
      },
      {
        label: "Prescription OCR",
        to: "/patient/ocr",
        icon: FileScan,
      },
      {
        label: "Refill Prediction",
        to: "/patient/refills",
        icon: Package,
      },
    ],
  },

  {
    group: "Care",
    items: [
      {
        label: "Reminder Center",
        to: "/patient/reminders",
        icon: Timer,
      },
      {
        label: "Calendar",
        to: "/patient/calendar",
        icon: CalendarDays,
      },
      {
        label: "AI Assistant",
        to: "/patient/assistant",
        icon: Bot,
      },
      {
        label: "Analytics",
        to: "/patient/analytics",
        icon: BarChart3,
      },
    ],
  },

  {
    group: "Account",
    items: [
      {
        label: "Notifications",
        to: "/patient/notifications",
        icon: Bell,
      },
      {
        label: "Profile",
        to: "/patient/profile",
        icon: UserRound,
      },
      {
        label: "Settings",
        to: "/patient/settings",
        icon: Cog,
      },
    ],
  },
];


/* ============================================================
   CAREGIVER NAVIGATION
============================================================ */

export const caregiverNav: NavGroup[] = [
  {
    group: "Monitoring",
    items: [
      {
        label: "Dashboard",
        to: "/caregiver",
        icon: LayoutDashboard,
      },
      {
        label: "Assigned Patients",
        to: "/caregiver/patients",
        icon: Users,
      },
      {
        label: "Critical Alerts",
        to: "/caregiver/alerts",
        icon: Siren,
      },
      {
        label: "Adherence Reports",
        to: "/caregiver/reports",
        icon: BarChart3,
      },
    ],
  },

  {
    group: "Account",
    items: [
      {
        label: "My Profile",
        to: "/caregiver/profile",
        icon: UserRound,
      },
      {
        label: "Account Settings",
        to: "/caregiver/settings",
        icon: Cog,
      },
    ],
  },
];


/* ============================================================
   ADMIN NAVIGATION
============================================================ */

export const adminNav: NavGroup[] = [
  {
    group: "Platform",
    items: [
      {
        label: "Dashboard",
        to: "/admin",
        icon: LayoutDashboard,
      },
      {
        label: "User Management",
        to: "/admin/users",
        icon: Users,
      },
      {
        label: "Platform Analytics",
        to: "/admin/analytics",
        icon: BarChart3,
      },
      {
        label: "System Monitoring",
        to: "/admin/system",
        icon: Activity,
      },
      {
        label: "Audit Logs",
        to: "/admin/audit",
        icon: ShieldCheck,
      },
    ],
  },
];


/* ============================================================
   ROLE METADATA
============================================================ */

const roleMeta = {
  patient: {
    title: "Patient Portal",
    nav: patientNav,
  },

  caregiver: {
    title: "Caregiver Portal",
    nav: caregiverNav,
  },

  admin: {
    title: "Admin Console",
    nav: adminNav,
  },
} as const;


export type PortalRole =
  keyof typeof roleMeta;


/* ============================================================
   ROLE-SPECIFIC ROUTES
============================================================ */

function getProfileRoute(
  role: PortalRole,
): string {
  switch (role) {
    case "patient":
      return "/patient/profile";

    case "caregiver":
      return "/caregiver/profile";

    case "admin":
      return "/admin/profile";
  }
}


function getSettingsRoute(
  role: PortalRole,
): string {
  switch (role) {
    case "patient":
      return "/patient/settings";

    case "caregiver":
      return "/caregiver/settings";

    case "admin":
      return "/admin/settings";
  }
}


function getNotificationRoute(
  role: PortalRole,
): string {
  switch (role) {
    case "patient":
      return "/patient/notifications";

    case "caregiver":
      return "/caregiver/alerts";

    case "admin":
      return "/admin/notifications";
  }
}


/* ============================================================
   NAVIGATION LINKS
============================================================ */

function NavLinks({
  nav,
  onNavigate,
}: {
  nav: NavGroup[];
  onNavigate?: () => void;
}) {
  const pathname =
    useRouterState({
      select: (state) =>
        state.location.pathname,
    });


  return (
    <nav className="flex flex-col gap-6 px-3 py-4">

      {nav.map((group) => (

        <div key={group.group}>

          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {group.group}
          </p>


          <ul className="space-y-1">

            {group.items.map((item) => {

              const active =
                pathname === item.to ||
                (
                  item.to !== "/patient" &&
                  item.to !== "/caregiver" &&
                  item.to !== "/admin" &&
                  pathname.startsWith(item.to)
                );


              return (
                <li key={item.to}>

                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",

                      active
                        ? "bg-primary-soft text-primary shadow-soft"
                        : "text-sidebar-foreground hover:bg-sidebar-accent",
                    )}
                  >

                    <item.icon
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />

                    <span className="truncate">
                      {item.label}
                    </span>

                  </Link>

                </li>
              );
            })}

          </ul>

        </div>
      ))}

    </nav>
  );
}


/* ============================================================
   PORTAL LAYOUT
============================================================ */

export function PortalLayout({
  role,
  children,
}: {
  role: PortalRole;
  children?: ReactNode;
}) {

  const {
    user,
    logout,
  } = useAuth();


  const meta =
    roleMeta[role];


  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);


  const navigate =
    useNavigate();


  /* ==========================================================
     CURRENT DATE
  ========================================================== */

  const formattedDate =
    new Date().toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );


  /* ==========================================================
     LOGOUT
  ========================================================== */

  const handleLogout =
    () => {

      logout();

      navigate({
        to: "/auth/login",
      });
    };


  /* ==========================================================
     USER INITIALS
  ========================================================== */

  const userInitials =
    user?.name
      ? user.name
          .split(" ")
          .filter(Boolean)
          .map(
            (part) =>
              part[0]
          )
          .join("")
          .toUpperCase()
      : "U";


  /* ==========================================================
     ROLE LABEL
  ========================================================== */

  const roleLabel =
    role === "patient"
      ? "Patient"
      : role === "caregiver"
        ? "Caregiver"
        : "Administrator";


  return (
    <div className="min-h-dvh bg-background">


      {/* ======================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside
        className="
          fixed
          inset-y-0
          left-0
          z-40
          hidden
          w-72
          border-r
          border-sidebar-border
          bg-sidebar
          lg:flex
          lg:flex-col
        "
      >

        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Logo />
        </div>


        <div className="flex flex-1 flex-col overflow-hidden">

          <div className="flex-1 overflow-y-auto">

            <NavLinks
              nav={meta.nav}
            />

          </div>


          <div className="border-t border-sidebar-border p-3">

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start rounded-xl"
            >

              <LogOut className="mr-2 h-4 w-4" />

              Sign out

            </Button>

          </div>

        </div>

      </aside>


      {/* ======================================================
          MAIN AREA
      ====================================================== */}

      <div className="lg:pl-72">


        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">

          <div className="grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6">


            {/* LEFT */}

            <div className="flex items-center gap-2">

              <Sheet
                open={mobileMenuOpen}
                onOpenChange={setMobileMenuOpen}
              >

                <SheetTrigger asChild>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-h-11 min-w-11 lg:hidden"
                    aria-label="Open navigation"
                  >

                    <Menu className="size-5" />

                  </Button>

                </SheetTrigger>


                <SheetContent
                  side="left"
                  className="w-72 bg-sidebar p-0"
                >

                  <SheetTitle className="sr-only">
                    Navigation
                  </SheetTitle>


                  <div className="flex h-16 items-center border-b border-sidebar-border px-5">
                    <Logo />
                  </div>


                  <div className="overflow-y-auto">

                    <NavLinks
                      nav={meta.nav}
                      onNavigate={() =>
                        setMobileMenuOpen(false)
                      }
                    />

                  </div>

                </SheetContent>

              </Sheet>


              <div className="hidden min-w-0 md:block">

                <h2 className="truncate text-lg font-bold">
                  {user?.name || "User"}
                </h2>

                <p className="truncate text-xs text-muted-foreground">
                  {meta.title}
                  {" · "}
                  {formattedDate}
                </p>

              </div>

            </div>


            {/* SEARCH */}

            <div className="relative min-w-0">

              <Search
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  size-4
                  -translate-y-1/2
                  text-muted-foreground
                "
                aria-hidden="true"
              />


              <Input
                type="search"
                placeholder="Search medicines, reminders…"
                aria-label="Global search"
                className="h-10 rounded-full border-border bg-muted/60 pl-9"
              />

            </div>


            {/* RIGHT */}

            <div className="flex items-center gap-2">


              {/* NOTIFICATIONS */}

              <Button
                variant="ghost"
                size="icon"
                className="relative min-h-11 min-w-11"
                aria-label={`${roleLabel} notifications`}
                asChild
              >

                <Link
                  to={getNotificationRoute(role) as any}
                >

                  <Bell className="size-5" />

                </Link>

              </Button>


              {/* USER MENU */}

              <DropdownMenu>

                <DropdownMenuTrigger
                  asChild
                >

                  <button
                    type="button"
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-border
                      bg-card
                      py-1
                      pl-1
                      pr-3
                      transition-colors
                      hover:bg-accent
                      focus:outline-none
                      focus:ring-2
                      focus:ring-primary/50
                    "
                  >

                    <Avatar className="size-8">

                      <AvatarFallback className="bg-primary-soft text-xs font-bold text-primary">
                        {userInitials}
                      </AvatarFallback>

                    </Avatar>


                    <span className="hidden max-w-32 truncate text-sm font-semibold sm:block">
                      {user?.name || "Loading..."}
                    </span>


                    <ChevronDown className="h-4 w-4 shrink-0" />

                  </button>

                </DropdownMenuTrigger>


                <DropdownMenuContent
                  align="end"
                  className="w-64"
                >

                  {/* USER INFORMATION */}

                  <DropdownMenuLabel>

                    <div className="flex flex-col">

                      <span className="truncate font-bold">
                        {user?.name || "Loading..."}
                      </span>


                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email || "Loading..."}
                      </span>


                      <span className="mt-2 w-fit rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                        {roleLabel}
                      </span>

                    </div>

                  </DropdownMenuLabel>


                  <DropdownMenuSeparator />


                  {/* PROFILE */}

                  <DropdownMenuItem asChild>

                    <Link
                      to={getProfileRoute(role)}
                      className="cursor-pointer"
                    >

                      <UserRound className="mr-2 h-4 w-4" />

                      My Profile

                    </Link>

                  </DropdownMenuItem>


                  {/* SETTINGS */}

                  <DropdownMenuItem asChild>

                    <Link
                      to={getSettingsRoute(role)}
                      className="cursor-pointer"
                    >

                      <Settings className="mr-2 h-4 w-4" />

                      Account Settings

                    </Link>

                  </DropdownMenuItem>


                  {/* NOTIFICATIONS */}

                  <DropdownMenuItem asChild>

                    <Link
                      to={getNotificationRoute(role)}
                      className="cursor-pointer"
                    >

                      <Bell className="mr-2 h-4 w-4" />

                      Notifications

                    </Link>

                  </DropdownMenuItem>


                  <DropdownMenuSeparator />


                  {/* LOGOUT */}

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >

                    <LogOut className="mr-2 h-4 w-4" />

                    Logout

                  </DropdownMenuItem>

                </DropdownMenuContent>

              </DropdownMenu>

            </div>

          </div>

        </header>


        {/* ======================================================
            PAGE CONTENT
        ====================================================== */}

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">

          {children ?? <Outlet />}

        </main>

      </div>

    </div>
  );
}