import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './assets/custom-styles.css'
import App from './App.jsx'
import { ToastProvider } from './components/ui/ToastContext'

// Configuración de localización en español para filtros y otros componentes
// addLocale('es', {
//   startsWith: 'Comienza con',
//   contains: 'Contiene',
//   notContains: 'No contiene',
//   endsWith: 'Termina con',
//   equals: 'Es igual a',
//   notEquals: 'No es igual a',
//   noFilter: 'Sin filtro',
//   lt: 'Menor que',
//   lte: 'Menor o igual que',
//   gt: 'Mayor que',
//   gte: 'Mayor o igual que',
//   dateIs: 'Fecha es',
//   dateIsNot: 'Fecha no es',
//   dateBefore: 'Fecha antes de',
//   dateAfter: 'Fecha después de',
//   clear: 'Limpiar',
//   apply: 'Aplicar',
//   matchAll: 'Coincidir todo',
//   matchAny: 'Coincidir cualquiera',
//   addRule: 'Agregar regla',
//   removeRule: 'Eliminar regla',
//   accept: 'Sí',
//   reject: 'No',
//   choose: 'Elegir',
//   upload: 'Subir',
//   cancel: 'Cancelar',
//   dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
//   dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
//   dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
//   monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
//   monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
//   today: 'Hoy',
//   emptyFilterMessage: 'No se encontraron resultados',
//   emptyMessage: 'No hay opciones disponibles',
//   aria: {
//     trueLabel: 'Verdadero',
//     falseLabel: 'Falso',
//     nullLabel: 'No seleccionado',
//     pageLabel: 'Página {page}',
//     firstPageLabel: 'Primera página',
//     lastPageLabel: 'Última página',
//     nextPageLabel: 'Página siguiente',
//     prevPageLabel: 'Página anterior',
//     selectRow: 'Fila seleccionada',
//     unselectRow: 'Fila no seleccionada',
//     showFilterMenu: 'Mostrar menú de filtro',
//     hideFilterMenu: 'Ocultar menú de filtro'
//   }
// })

// Establecer localización en español
// locale('es')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)
