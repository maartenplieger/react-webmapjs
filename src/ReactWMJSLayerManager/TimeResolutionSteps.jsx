export const timeResolutionSteps = [
  { value: 10, title: '10 seconds' },
  { value: 12, title: '12 seconds' },
  { value: 15, title: '15 seconds' },
  { value: 20, title: '20 seconds' },
  { value: 30, title: '30 seconds' },
  { value: 45, title: '45 seconds' },
  { value: 60, title: '1 minute' },
  { value: 60 * 2, title: '2 minutes' },
  { value: 60 * 2.5, title: '2.5 minutes' },
  { value: 60 * 5, title: '5 minutes' },
  { value: 60 * 10, title: '10 minutes' },
  { value: 60 * 15, title: '15 minutes' },
  { value: 60 * 30, title: '30 minutes' },
  { value: 60 * 60, title: '1 hour' },
  { value: 60 * 60 * 2, title: '2 hours' },
  { value: 60 * 60 * 4, title: '4 hours' },
  { value: 60 * 60 * 8, title: '8 hours' },
  { value: 60 * 60 * 16, title: '16 hours' },
  { value: 60 * 60 * 24, title: '1 day' },
  { value: 60 * 60 * 24 * 2, title: '2 days' },
  { value: 60 * 60 * 24 * 5, title: '5 days' },
  { value: 60 * 60 * 24 * 10, title: '10 days' },
  { value: 60 * 60 * 24 * 20, title: '20 days' },
  { value: 60 * 60 * 24 * 30, title: '1 monts' },
  { value: 60 * 60 * 24 * 60, title: '2 months' },
  { value: 60 * 60 * 24 * 90, title: '3 months' },
  { value: 60 * 60 * 24 * 182, title: '6 months' },
  { value: 60 * 60 * 24 * 365, title: '1 year' }
];

export const timeResolutionGetIndexForValue = (currentTimeResolution) => { return timeResolutionSteps.findIndex((a) => a.value === currentTimeResolution); };

export const timeResolutionGetObject = (currentTimeResolution) => {
  let index = timeResolutionGetIndexForValue(currentTimeResolution);
  return timeResolutionSteps[index];
};
