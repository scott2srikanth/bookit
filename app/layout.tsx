import type {Metadata} from "next";import "./globals.css";
export const metadata:Metadata={title:{default:"DigiKatha — A sanctuary for every story",template:"%s · DigiKatha"},description:"A private writers’ hub for shaping ideas, drafting manuscripts, and publishing stories beautifully."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
