import { createTheme } from '@mui/material/styles';
import { arSD } from '@mui/material/locale';

const theme = createTheme(
  {
    palette: {
      primary: {
        light: '#9c64a6',
        main: '#673ab7', // Purple color from Material UI
        dark: '#482880',
        contrastText: '#fff',
      },
      secondary: {
        light: '#ff79b0',
        main: '#ff4081', // Pink accent color
        dark: '#c60055',
        contrastText: '#fff',
      },
      background: {
        default: '#f5f5f5',
        paper: '#fff',
      },
    },
    typography: {
      fontFamily: [
        'Roboto',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(','),
    },
    direction: 'rtl', // Right-to-left for Arabic language
  },
  arSD, // Arabic (Saudi Arabia) locale
);

export default theme;