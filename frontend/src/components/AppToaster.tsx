import { ToastContainer } from 'react-toastify';
import { useTheme } from '../context/ThemeContext';

export function AppToaster() {
  const { theme } = useTheme();

  return (
    <ToastContainer
      theme={theme}
      position="top-center"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable={false}
      pauseOnHover
      limit={3}
    />
  );
}
