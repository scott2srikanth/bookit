import type {Metadata} from "next";import "./globals.css";
export const metadata:Metadata={title:{default:"BookIt — Write books beautifully",template:"%s · BookIt"},description:"A private, local-first writing studio for planning, drafting, and publishing your next book."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
