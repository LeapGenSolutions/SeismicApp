import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { SOS_URL } from '../constants';

// Async thunk to fetch Summary of Summaries
export const fetchSummaryOfSummaries = createAsyncThunk(
  'summaries/fetchSummaryOfSummaries',
  async ({ doctorEmail, patientId }, thunkAPI) => {
    const url = `${SOS_URL}summaries/${doctorEmail}/${patientId}`;
    console.log("📡 Calling Summary of Summaries API:", url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // adjust payload if needed
      });

      const data = await response.json();
      console.log("✅ API Response:", data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch summary');
      }

      return {
        key: `${doctorEmail}-${patientId}`,
        summary: data?.combined_summary || 'No summary available',
      };
    } catch (error) {
      console.error("❌ API Error:", error);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  summaryOfSummariesCache: {},
  loading: false,
  error: null,
};

// Slice
const summarySlice = createSlice({
  name: 'summaries',
  initialState,
  reducers: {
    clearSummaries: (state) => {
      state.summaryOfSummariesCache = {};
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummaryOfSummaries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSummaryOfSummaries.fulfilled, (state, action) => {
        const { key, summary } = action.payload;
        state.summaryOfSummariesCache[key] = summary;
        state.loading = false;
      })
      .addCase(fetchSummaryOfSummaries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch';
      });
  },
});

// Exports
export const { clearSummaries } = summarySlice.actions;
export default summarySlice.reducer;