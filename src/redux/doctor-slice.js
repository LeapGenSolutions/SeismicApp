// src/redux/doctor-slice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  doctors: [
    { value: "1", label: "Dr. A" },
    { value: "2", label: "Dr. B" },
    { value: "3", label: "Dr. C" },
    { value: "4", label: "Dr. D" },
  ],
  selectedDoctors: [],
};

const doctorSlice = createSlice({
  name: "doctors",
  initialState,
  reducers: {
    setSelectedDoctors: (state, action) => {
      state.selectedDoctors = action.payload;
    },
    setDoctorsList: (state, action) => {
      state.doctors = action.payload;
    },
  },
});

export const { setSelectedDoctors, setDoctorsList } = doctorSlice.actions;

export default doctorSlice;