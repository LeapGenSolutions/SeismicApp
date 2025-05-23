// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import appointmentReducer from './appointment-slice';

export const store = configureStore({
  reducer: {
    appointments: appointmentReducer.reducer,
  },
});
