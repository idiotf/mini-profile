import { FileListStore } from '@/stores/file-list-store'
import { ThemeProvider } from '@/components/theme-provider'

const fileListStore = new FileListStore()
export function useFileListStore() {
  return fileListStore
}

export function Providers({ children }: React.PropsWithChildren) {
  return <ThemeProvider enableHotkey>{children}</ThemeProvider>
}
