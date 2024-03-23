'use server';
// all the exported functions are marked as server functions
// these can be imported into client and server components

import { z } from 'zod'; // typescript-first validaton library
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache'; // clears cache since you're updating the data and want to show the changes
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
}); // matches the shape of your form object

const CreateInvoice = FormSchema.omit({ id: true, date: true });

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export const createInvoice = async (formData: FormData) => {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice',
    };
  }

  revalidatePath('/dashboard/invoices');
  // once the database has been updated, the path will be revalidated, and fresh data will be fetched from the server

  redirect('/dashboard/invoices');
};

export const updateInvoice = async (id: string, formData: FormData) => {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;

  try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
    `;
  } catch (error) {
    return {
      message: 'Database Error Failed to Update Invoice',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
};

export const deleteInvoice = async (id: string) => {
  throw new Error('Failed to Delete Invoice');

  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return { message: 'Deleted Invoice' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
};
