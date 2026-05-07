import { AppBuilder } from "@/components/app-builder"
import { ToastProvider } from "@/components/toast"

export default function Home() {
  return (
    <ToastProvider>
      <AppBuilder />
    </ToastProvider>
  )
}
