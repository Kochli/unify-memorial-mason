import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer, DrawerContent, useOnDrawerReset } from '@/shared/components/ui/drawer';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { useCreateCompany } from '../hooks/useCompanies';
import { companyFormSchema, type CompanyFormData } from '../schemas/company.schema';
import { toCompanyInsert, parseTeamMembers } from '../utils/companyTransform';
import { useToast } from '@/shared/hooks/use-toast';
import { AppDrawerLayout, DrawerSection, DrawerGrid } from '@/shared/components/drawer';

interface CreateCompanyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateCompanyDrawer: React.FC<CreateCompanyDrawerProps> = ({
  open,
  onOpenChange,
}) => {
  const { mutate: createCompany, isPending } = useCreateCompany();
  const { toast } = useToast();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      email: '',
      team_members: [],
      notes: '',
    },
  });

  // Clear any draft state when the drawer has been closed
  useOnDrawerReset(() => {
    form.reset();
  });

  const onSubmit = (values: CompanyFormData) => {
    const payload = toCompanyInsert(values);
    createCompany(payload, {
      onSuccess: () => {
        toast({
          title: 'Company created',
          description: 'Company has been created successfully.',
        });
        form.reset();
        onOpenChange(false);
      },
      onError: (error: Error) => {
        toast({
          title: 'Error creating company',
          description: error?.message || 'Failed to create company.',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col max-h-[96vh] min-h-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <AppDrawerLayout
              title="Create Company"
              description="Add a new company record."
              primaryLabel={isPending ? 'Creating...' : 'Create'}
              primaryDisabled={isPending}
              primaryType="submit"
              secondaryLabel="Cancel"
              onSecondary={() => onOpenChange(false)}
              onClose={() => onOpenChange(false)}
            >
              <DrawerSection title="Details">
                <DrawerGrid cols={2}>
                  <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-xs font-medium">Company Name *</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="Acme Corporation" {...field} />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Email</FormLabel>
                    <FormControl>
                      <Input className="h-9" type="email" placeholder="contact@example.com" {...field} />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Phone</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="+44 123 456 7890" {...field} />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-xs font-medium">Address</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">City</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="London" {...field} />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Country</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="United Kingdom" {...field} />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="team_members"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-xs font-medium">Team Members</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[80px]"
                        placeholder="Enter names separated by commas or new lines (e.g., John Doe, Jane Smith)"
                        rows={3}
                        value={field.value.join(', ')}
                        onChange={(e) => {
                          const parsed = parseTeamMembers(e.target.value);
                          field.onChange(parsed);
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                    <p className="text-[11px] text-muted-foreground">
                      Separate names with commas or new lines
                    </p>
                  </FormItem>
                )}
              />
                </DrawerGrid>
              </DrawerSection>
              <DrawerSection title="Notes" collapsible defaultOpen={false}>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Notes</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[60px]" placeholder="Additional notes..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
              </DrawerSection>
            </AppDrawerLayout>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
};

