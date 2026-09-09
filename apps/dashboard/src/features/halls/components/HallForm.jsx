import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { createHallSchema } from '../schemas/hallSchemas';
import { ImageUploader } from './ImageUploader';
import { useServices } from '../hooks/useServices';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, Sun, Moon, Clock } from 'lucide-react';

export function HallForm({ initialData, onSubmit, isSubmitting, submitLabel = "Create Venue", title = "New Venue Listing", description = "Fill in the basic information for your venue." }) {
  const navigate = useNavigate();
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const services = servicesData?.data || [];
  
  const [photos, setPhotos] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  // Map initialData daytimePrices to flat fields
  const daytimeDefaults = {};
  if (initialData?.daytimePrices) {
    for (const dp of initialData.daytimePrices) {
      if (dp.daytime === 'MORNING') daytimeDefaults.morningPrice = dp.price;
      if (dp.daytime === 'EVENING') daytimeDefaults.eveningPrice = dp.price;
      if (dp.daytime === 'FULL_DAY') daytimeDefaults.fullDayPrice = dp.price;
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createHallSchema),
    defaultValues: {
      name: '',
      description: '',
      city: '',
      area: '',
      address: '',
      capacity: '',
      depositAmount: '',
      morningPrice: '',
      eveningPrice: '',
      fullDayPrice: '',
      currency: 'YER',
      ...initialData,
      ...daytimeDefaults
    },
  });

  useEffect(() => {
    if (initialData) {
      const mapped = { ...initialData };
      if (initialData.daytimePrices) {
        for (const dp of initialData.daytimePrices) {
          if (dp.daytime === 'MORNING') mapped.morningPrice = dp.price;
          if (dp.daytime === 'EVENING') mapped.eveningPrice = dp.price;
          if (dp.daytime === 'FULL_DAY') mapped.fullDayPrice = dp.price;
        }
      }
      reset(mapped);
      if (initialData.photos) setPhotos(initialData.photos);
      if (initialData.serviceIds) setSelectedServices(initialData.serviceIds);
      if (initialData.services && !initialData.serviceIds) {
        setSelectedServices(initialData.services.map(s => s.id));
      }
    }
  }, [initialData, reset]);

  const currency = watch('currency');

  const handleFormSubmit = (data) => {
    const { morningPrice, eveningPrice, fullDayPrice, capacity, depositAmount, ...rest } = data;
    const payload = {
      ...rest,
      capacity: Number(capacity),
      depositAmount: Number(depositAmount),
      photos,
      serviceIds: selectedServices,
      daytimePrices: [
        { daytime: 'MORNING', price: Number(morningPrice) },
        { daytime: 'EVENING', price: Number(eveningPrice) },
        { daytime: 'FULL_DAY', price: Number(fullDayPrice) },
      ]
    };
    onSubmit(payload);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => navigate('/owner/halls')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Venue
      </Button>

      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            
            {/* Venue Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Venue Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Al-Salam Grand Venue"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your venue, facilities, and what makes it special..."
                rows={4}
                {...register('description')}
              />
            </div>

            {/* Photos Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Photos
              </h3>
              <ImageUploader photos={photos} onChange={setPhotos} />
            </div>

            {/* Services Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Services & Amenities
              </h3>
              
              {servicesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading services...
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {services?.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedServices([...selectedServices, service.id]);
                          } else {
                            setSelectedServices(selectedServices.filter((id) => id !== service.id));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`service-${service.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {service.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Location
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="e.g. Sana'a"
                    {...register('city')}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">{errors.city.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Area</Label>
                  <Input
                    id="area"
                    placeholder="e.g. Hadda"
                    {...register('area')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Full street address"
                  {...register('address')}
                />
              </div>
            </div>

            {/* Capacity & Pricing Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Capacity & Pricing
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">
                    Capacity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    placeholder="e.g. 200"
                    {...register('capacity')}
                  />
                  {errors.capacity && (
                    <p className="text-sm text-destructive">{errors.capacity.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={currency}
                    onValueChange={(val) => setValue('currency', val)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YER">YER (Yemeni Rial)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="SAR">SAR (Saudi Riyal)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Daytime Prices */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Daytime Prices <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="morningPrice" className="flex items-center gap-1.5 text-sm">
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                      Morning
                    </Label>
                    <Input
                      id="morningPrice"
                      type="number"
                      min="0"
                      placeholder="e.g. 100000"
                      {...register('morningPrice')}
                    />
                    {errors.morningPrice && (
                      <p className="text-sm text-destructive">{errors.morningPrice.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eveningPrice" className="flex items-center gap-1.5 text-sm">
                      <Moon className="h-3.5 w-3.5 text-indigo-400" />
                      Evening
                    </Label>
                    <Input
                      id="eveningPrice"
                      type="number"
                      min="0"
                      placeholder="e.g. 150000"
                      {...register('eveningPrice')}
                    />
                    {errors.eveningPrice && (
                      <p className="text-sm text-destructive">{errors.eveningPrice.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullDayPrice" className="flex items-center gap-1.5 text-sm">
                      <Clock className="h-3.5 w-3.5 text-emerald-500" />
                      Full Day
                    </Label>
                    <Input
                      id="fullDayPrice"
                      type="number"
                      min="0"
                      placeholder="e.g. 200000"
                      {...register('fullDayPrice')}
                    />
                    {errors.fullDayPrice && (
                      <p className="text-sm text-destructive">{errors.fullDayPrice.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Deposit Amount */}
              <div className="space-y-2">
                <Label htmlFor="depositAmount">
                  Deposit Amount <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="depositAmount"
                  type="number"
                  min="0"
                  placeholder="e.g. 50000"
                  {...register('depositAmount')}
                />
                {errors.depositAmount && (
                  <p className="text-sm text-destructive">{errors.depositAmount.message}</p>
                )}
                <p className="text-xs text-muted-foreground">Flat amount customers must pay as deposit when booking.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/owner/halls')}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {submitLabel}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
