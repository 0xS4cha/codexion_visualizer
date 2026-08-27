import { createBrowserRouter } from "react-router-dom";


export const router = createBrowserRouter([
  {
    path: "/",
    // element: <Layout />,
    children: [
        {
            index: true,
            lazy: async () => {
                const { default: Component } = await import("@/pages/Visualizer");
                return { Component };
            },
        },
        {
            path: "login",
            lazy: async () => {
            const { default: Component } = await import("@/pages/Login");
            return { Component };
            },
        },
        {
            path: "hub",
            lazy: async () => {
            const { default: Component } = await import("@/pages/Edgecase");
            return { Component };
            },
        },
        {
            path: "world",
            lazy: async () => {
            const { default: Component } = await import("@/pages/World");
            return { Component };
            },
        },
        {
            path: "community",
            lazy: async () => {
            const { default: Component } = await import("@/pages/Community");
            return { Component };
            },
        },
        {
            path: "terms",
            lazy: async () => {
                const { default: Component } = await import("@/pages/Terms");
                return { Component };
            },
        },
        {
            path: "privacy",
            lazy: async () => {
                const { default: Component } = await import("@/pages/Privacy");
                return { Component };
            },
        },
       {
         path: "*",
         lazy: async () => {
           const { default: Component } = await import("@/pages/NotFound");
           return { Component };
         },
       },
    ],
  },
]);