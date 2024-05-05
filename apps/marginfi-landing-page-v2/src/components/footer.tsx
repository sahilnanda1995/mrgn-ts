import React from "react";

import Link from "next/link";

import { IconBrandDiscordFilled, IconBrandGithub, IconBrandX, IconBrandLinkedin } from "@tabler/icons-react";

import { Logo } from "~/components/ui/logo";

const CONTENT: {
  links: {
    heading: string;
    list: {
      icon?: JSX.Element;
      href: string;
      label: string;
    }[];
  }[];
} = {
  links: [
    {
      heading: "Learn More",
      list: [
        {
          href: "#",
          label: "Documentation",
        },
        {
          href: "#",
          label: "GitHub",
        },
      ],
    },
    {
      heading: "Resources",
      list: [
        {
          href: "#",
          label: "Terms of use",
        },
        {
          href: "#",
          label: "Privacy policy",
        },
      ],
    },
    {
      heading: "Community",
      list: [
        {
          icon: <IconBrandDiscordFilled />,
          href: "#",
          label: "Discord",
        },
        {
          icon: <IconBrandGithub />,
          href: "#",
          label: "GitHub",
        },
        {
          icon: <IconBrandX />,
          href: "#",
          label: "X",
        },
        {
          icon: <IconBrandLinkedin />,
          href: "#",
          label: "LinkedIn",
        },
      ],
    },
  ],
};

export const Footer = () => {
  return (
    <footer className="border-t border-muted-foreground/70 py-12">
      <div className="flex justify-between gap-4 container max-w-7xl">
        <div className="flex flex-col gap-4 mr-40 shrink-0">
          <Logo size={36} wordmark={true} />
          <small className="text-muted-foreground">
            {new Date().getFullYear()} &copy; Margin INC. All rights reserved.
          </small>
        </div>

        <div className="flex justify-between w-full pt-4">
          {CONTENT.links.map((category, index) => (
            <ul key={index} className="space-y-2">
              <li className="text-muted-foreground">{category.heading}</li>
              <ul className="space-y-2">
                {category.list.map((item, index) => (
                  <li key={index}>
                    <Link className="flex items-center gap-1" href={item.href}>
                      {item.icon && React.cloneElement(item.icon, { size: 18 })}
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </ul>
          ))}
        </div>
      </div>
    </footer>
  );
};
