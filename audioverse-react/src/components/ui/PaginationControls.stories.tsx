import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PaginationControls from './PaginationControls';

const meta: Meta<typeof PaginationControls> = {
  title: 'UI/PaginationControls',
  component: PaginationControls,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PaginationControls>;

export const Default: Story = {
  args: { page: 1, pageSize: 20, total: 123, onPageChange: () => {}, onPageSizeChange: () => {} },
};

export const FirstPage: Story = {
  args: { page: 1, pageSize: 10, total: 50, onPageChange: () => {}, onPageSizeChange: () => {} },
};

export const MiddlePage: Story = {
  args: { page: 3, pageSize: 10, total: 50, onPageChange: () => {}, onPageSizeChange: () => {} },
};

export const LastPage: Story = {
  args: { page: 5, pageSize: 10, total: 50, onPageChange: () => {}, onPageSizeChange: () => {} },
};

export const Interactive = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  return (
    <div style={{ padding: 20 }}>
      <p>Current: page {page}, size {pageSize}</p>
      <PaginationControls page={page} pageSize={pageSize} total={123} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  );
};
