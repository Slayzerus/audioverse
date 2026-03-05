import type { Meta, StoryObj } from '@storybook/react';
import { SimpleLineChart, SimpleBarChart } from './Charts';

type ChartData = { month: string; value: number };

const sampleData: ChartData[] = [
  { month: 'Jan', value: 120 },
  { month: 'Feb', value: 200 },
  { month: 'Mar', value: 150 },
  { month: 'Apr', value: 300 },
  { month: 'May', value: 280 },
  { month: 'Jun', value: 350 },
  { month: 'Jul', value: 420 },
];

// ---------- SimpleLineChart ----------

const lineMeta: Meta<typeof SimpleLineChart<ChartData>> = {
  title: 'Common/SimpleLineChart',
  component: SimpleLineChart,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'color' },
    height: { control: { type: 'range', min: 100, max: 400, step: 20 } },
  },
};
export default lineMeta;
type LineStory = StoryObj<typeof SimpleLineChart<ChartData>>;

export const Default: LineStory = {
  args: { data: sampleData, xKey: 'month', yKey: 'value' },
};

export const CustomColor: LineStory = {
  args: { data: sampleData, xKey: 'month', yKey: 'value', color: '#e91e63' },
};

export const Tall: LineStory = {
  args: { data: sampleData, xKey: 'month', yKey: 'value', height: 360 },
};

// ---------- SimpleBarChart ----------

export const BarDefault: StoryObj<typeof SimpleBarChart<ChartData>> = {
  render: (args) => <SimpleBarChart {...args} />,
  args: { data: sampleData, xKey: 'month', yKey: 'value' },
};

export const BarCustomColor: StoryObj<typeof SimpleBarChart<ChartData>> = {
  render: (args) => <SimpleBarChart {...args} />,
  args: { data: sampleData, xKey: 'month', yKey: 'value', color: '#ff9800' },
};

export const BothCharts = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 20 }}>
    <div>
      <h4 style={{ margin: '0 0 8px', color: '#aaa' }}>Line Chart</h4>
      <SimpleLineChart data={sampleData} xKey="month" yKey="value" />
    </div>
    <div>
      <h4 style={{ margin: '0 0 8px', color: '#aaa' }}>Bar Chart</h4>
      <SimpleBarChart data={sampleData} xKey="month" yKey="value" />
    </div>
  </div>
);
