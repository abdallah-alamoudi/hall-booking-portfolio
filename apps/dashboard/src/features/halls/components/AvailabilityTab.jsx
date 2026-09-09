import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAvailability } from '../hooks/useAvailability';
import { CalendarIcon, Clock3, Loader2, Moon, Plus, Sun, Trash2, ExternalLink } from 'lucide-react';

const DAYTIME_OPTIONS = [
  { value: 'MORNING', label: 'Morning', icon: Sun, colorClass: 'text-amber-600' },
  { value: 'EVENING', label: 'Evening', icon: Moon, colorClass: 'text-indigo-600' },
  { value: 'FULL_DAY', label: 'Full Day', icon: Clock3, colorClass: 'text-emerald-600' }
];

const DAYTIME_LABELS = Object.freeze({
  MORNING: 'Morning',
  EVENING: 'Evening',
  FULL_DAY: 'Full Day'
});

const DAYTIME_ORDER = Object.freeze({
  FULL_DAY: 0,
  MORNING: 1,
  EVENING: 2
});

function toDate(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function toDateKey(period) {
  return period.date || format(new Date(period.startAt), 'yyyy-MM-dd');
}

function isFullyBusy(slots = []) {
  return slots.includes('MORNING') && slots.includes('EVENING');
}

function getPeriodKey(period) {
  return `${period.type}-${period.blockId || period.bookingId || period.id}-${toDateKey(period)}-${period.daytime || 'FULL_DAY'}`;
}

export function AvailabilityTab({ hallId }) {
  const { busyPeriods, busySlotsMap, isLoading, createBlock, deleteBlock } = useAvailability(hallId);
  const [date, setDate] = useState();
  const [selectedDaytime, setSelectedDaytime] = useState('FULL_DAY');
  const [note, setNote] = useState('');
  const [focusedBusyPeriodKey, setFocusedBusyPeriodKey] = useState(null);
  const calendarHostRef = useRef(null);
  const [calendarLayout, setCalendarLayout] = useState({
    twoMonths: false,
    cellSize: '3rem'
  });

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
  }, []);

  useEffect(() => {
    const node = calendarHostRef.current;
    if (!node) return undefined;

    const computeLayout = (width) => {
      if (width >= 1250) {
        setCalendarLayout({ twoMonths: true, cellSize: '3rem' });
        return;
      }

      if (width >= 900) {
        setCalendarLayout({ twoMonths: false, cellSize: '3.25rem' });
        return;
      }

      if (width >= 640) {
        setCalendarLayout({ twoMonths: false, cellSize: '2.95rem' });
        return;
      }

      setCalendarLayout({ twoMonths: false, cellSize: '2.55rem' });
    };

    computeLayout(node.clientWidth);

    if (typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width || node.clientWidth;
      computeLayout(width);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const selectedDateKey = date ? format(date, 'yyyy-MM-dd') : null;
  const busySlotsForDate = selectedDateKey ? busySlotsMap[selectedDateKey] || [] : [];
  const availableDaytimes = DAYTIME_OPTIONS.filter((option) => !busySlotsForDate.includes(option.value));

  const { fullyBusyDates, partiallyBusyDates } = useMemo(() => {
    const full = [];
    const partial = [];

    Object.entries(busySlotsMap).forEach(([dateKey, slots]) => {
      const parsedDate = toDate(dateKey);
      if (isFullyBusy(slots)) {
        full.push(parsedDate);
        return;
      }

      if (slots.length > 0) {
        partial.push(parsedDate);
      }
    });

    return {
      fullyBusyDates: full,
      partiallyBusyDates: partial
    };
  }, [busySlotsMap]);

  const selectedDateBusyPeriods = useMemo(() => {
    if (!selectedDateKey) return [];

    return busyPeriods
      .filter((period) => toDateKey(period) === selectedDateKey)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'BLOCKED' ? -1 : 1;
        const aOrder = DAYTIME_ORDER[a.daytime || 'FULL_DAY'] ?? 99;
        const bOrder = DAYTIME_ORDER[b.daytime || 'FULL_DAY'] ?? 99;
        return aOrder - bOrder;
      });
  }, [busyPeriods, selectedDateKey]);

  const focusedBusyPeriod = useMemo(() => {
    if (!focusedBusyPeriodKey) return null;
    return selectedDateBusyPeriods.find((period) => getPeriodKey(period) === focusedBusyPeriodKey) || null;
  }, [focusedBusyPeriodKey, selectedDateBusyPeriods]);

  useEffect(() => {
    if (!selectedDateKey) {
      setSelectedDaytime('FULL_DAY');
      setFocusedBusyPeriodKey(null);
      return;
    }

    const selectedStillAvailable = availableDaytimes.some((option) => option.value === selectedDaytime);
    if (!selectedStillAvailable) {
      setSelectedDaytime(availableDaytimes[0]?.value || '');
    }

    setFocusedBusyPeriodKey(null);
  }, [availableDaytimes, selectedDateKey, selectedDaytime]);

  const handleCreateBlock = () => {
    if (!date || !selectedDaytime) return;

    const dateOnly = format(date, 'yyyy-MM-dd');

    createBlock.mutate(
      {
        startAt: dateOnly,
        endAt: dateOnly,
        type: 'BLOCKED',
        daytime: selectedDaytime,
        note: note || 'Maintenance'
      },
      {
        onSuccess: () => {
          setDate(undefined);
          setSelectedDaytime('FULL_DAY');
          setFocusedBusyPeriodKey(null);
          setNote('');
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedDaytimeLabel = DAYTIME_OPTIONS.find((option) => option.value === selectedDaytime)?.label || 'Selected Slot';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <Card className="min-w-0 overflow-hidden border-white/80 bg-white/90 shadow-xl shadow-slate-200/50">
          <CardHeader className="bg-[linear-gradient(135deg,_hsl(188_63%_93%),_hsl(35_92%_95%))]">
            <CardTitle className="text-xl tracking-tight">Manage Availability</CardTitle>
            <CardDescription>
              Click a busy slot to inspect reason or booking details. Available slots stay selectable for new blocks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4">
              <div
                ref={calendarHostRef}
                className="w-full overflow-x-auto rounded-2xl border border-white/80 bg-gradient-to-b from-slate-50 to-white p-4 shadow-inner"
              >
                <div className="mx-auto w-fit">
                  <Calendar
                    mode="single"
                    numberOfMonths={calendarLayout.twoMonths ? 2 : 1}
                    selected={date}
                    onSelect={setDate}
                    disabled={[{ before: today }, ...fullyBusyDates]}
                    modifiers={{
                      fullBusy: fullyBusyDates,
                      partialBusy: partiallyBusyDates
                    }}
                    modifiersStyles={{
                      fullBusy: { color: '#ffffff', backgroundColor: '#ef4444' },
                      partialBusy: { color: '#92400e', backgroundColor: '#fde68a' }
                    }}
                    style={{ '--cell-size': calendarLayout.cellSize }}
                    className="rounded-2xl border border-primary/15 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span>Fully Busy</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-amber-300" />
                  <span>Partially Busy</span>
                </div>
              </div>
            </div>

            {date && (
              <div className="space-y-4 rounded-xl border border-primary/15 bg-primary/5 p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-white/90 text-slate-700">
                    {format(date, 'PPP')}
                  </Badge>
                </div>

                <div className="grid gap-2">
                  <Label className="text-slate-700">Daytime Slot</Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {DAYTIME_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isUnavailable = busySlotsForDate.includes(option.value);
                      const isSelected = selectedDaytime === option.value;
                      const blockingPeriod = selectedDateBusyPeriods.find(
                        (period) => (period.daytime || 'FULL_DAY') === option.value
                      );

                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-disabled={isUnavailable}
                          onClick={() => {
                            if (isUnavailable) {
                              setFocusedBusyPeriodKey(blockingPeriod ? getPeriodKey(blockingPeriod) : null);
                              return;
                            }
                            setFocusedBusyPeriodKey(null);
                            setSelectedDaytime(option.value);
                          }}
                          className={`min-h-[56px] rounded-xl border px-3 py-2 text-left transition-all ${
                            isSelected && !isUnavailable
                              ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                              : 'border-border bg-background/95 hover:bg-accent/40'
                          } ${isUnavailable ? 'cursor-not-allowed opacity-65' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 text-sm font-semibold">
                              <Icon className={`h-4 w-4 ${option.colorClass}`} />
                              {option.label}
                            </span>
                            <Badge variant={isUnavailable ? 'destructive' : 'secondary'}>
                              {isUnavailable ? 'Busy' : 'Open'}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {focusedBusyPeriod && (
                  <div className="space-y-2 rounded-xl border border-slate-200 bg-white/90 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={focusedBusyPeriod.type === 'BOOKED' ? 'destructive' : 'secondary'}>
                        {focusedBusyPeriod.type}
                      </Badge>
                      <Badge variant="outline">
                        {DAYTIME_LABELS[focusedBusyPeriod.daytime || 'FULL_DAY'] || focusedBusyPeriod.daytime || 'FULL_DAY'}
                      </Badge>
                    </div>

                    {focusedBusyPeriod.type === 'BLOCKED' ? (
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">Reason:</span> {focusedBusyPeriod.note || 'No reason provided.'}
                      </p>
                    ) : (
                      <div className="space-y-2 text-sm text-slate-700">
                        <p>
                          <span className="font-semibold">Booking ID:</span> {focusedBusyPeriod.bookingId}
                        </p>
                        {focusedBusyPeriod.booking?.status && (
                          <p>
                            <span className="font-semibold">Status:</span> {focusedBusyPeriod.booking.status}
                          </p>
                        )}
                        {focusedBusyPeriod.booking?.customer?.fullName && (
                          <p>
                            <span className="font-semibold">Customer:</span> {focusedBusyPeriod.booking.customer.fullName}
                          </p>
                        )}
                        {focusedBusyPeriod.booking?.purpose && (
                          <p>
                            <span className="font-semibold">Purpose:</span> {focusedBusyPeriod.booking.purpose}
                          </p>
                        )}
                        {focusedBusyPeriod.bookingId && (
                          <Button asChild size="sm" className="gap-2 rounded-lg">
                            <Link to={`/owner/bookings/${focusedBusyPeriod.bookingId}`}>
                              View Booking Details
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="note" className="text-slate-700">Block Reason</Label>
                  <Input
                    id="note"
                    placeholder="e.g. Renovation, Private Event"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full gap-2 rounded-xl shadow-lg shadow-primary/20"
                  onClick={handleCreateBlock}
                  disabled={createBlock.isPending || !selectedDaytime}
                >
                  {createBlock.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Block {selectedDaytimeLabel} on {format(date, 'PPP')}
                </Button>

                {availableDaytimes.length === 0 && (
                  <p className="text-sm text-destructive">
                    All daytime slots are already busy for this date.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 border-white/80 bg-white/90 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-xl tracking-tight">Busy Slots</CardTitle>
            <CardDescription>
              Click any item to inspect it. Bookings open directly to details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {busyPeriods.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/20 py-12 text-center text-muted-foreground">
                <CalendarIcon className="mx-auto mb-2 h-8 w-8 opacity-20" />
                <p>No busy slots found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {busyPeriods.map((period, idx) => {
                  const rowDateKey = toDateKey(period);
                  const rowKey = getPeriodKey(period);

                  return (
                    <div
                      key={`${rowKey}-${idx}`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setDate(toDate(rowDateKey));
                          setFocusedBusyPeriodKey(rowKey);
                        }
                      }}
                      onClick={() => {
                        setDate(toDate(rowDateKey));
                        setFocusedBusyPeriodKey(rowKey);
                      }}
                      className="space-y-2 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${period.type === 'BOOKED' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {format(toDate(rowDateKey), 'PPP')}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs uppercase text-muted-foreground">
                                {period.type}
                              </p>
                              <span className="text-xs text-muted-foreground">-</span>
                              <p className="text-xs uppercase text-muted-foreground">
                                {DAYTIME_LABELS[period.daytime || 'FULL_DAY'] || period.daytime || 'FULL_DAY'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {period.type === 'BLOCKED' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteBlock.mutate(period.blockId || period.id);
                            }}
                            disabled={deleteBlock.isPending}
                          >
                            {deleteBlock.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>

                      {period.type === 'BLOCKED' ? (
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold">Reason:</span> {period.note || 'No reason provided.'}
                        </p>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          {period.booking?.status && (
                            <Badge variant="outline" className="text-[11px]">
                              {period.booking.status}
                            </Badge>
                          )}
                          {period.bookingId && (
                            <Button asChild size="sm" variant="outline" className="h-7 gap-1 text-xs">
                              <Link to={`/owner/bookings/${period.bookingId}`}>
                                Booking Details
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
