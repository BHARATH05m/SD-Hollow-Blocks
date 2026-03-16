import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import OwnerNavbar from "../components/OwnerNavbar.jsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const HenManagement = () => {
  const [date, setDate] = useState("");
  const [sampleCount, setSampleCount] = useState(5);
  const [weights, setWeights] = useState(Array(5).fill(""));
  const [totalFeed, setTotalFeed] = useState("");
  const [totalTruckWeight, setTotalTruckWeight] = useState("");
  const [previousTotalWeight, setPreviousTotalWeight] = useState("");
  const [totalChickenCount, setTotalChickenCount] = useState("");

  const [averageWeight, setAverageWeight] = useState(null);
  const [totalWeightGain, setTotalWeightGain] = useState(null);
  const [fcr, setFcr] = useState(null);

  const [errors, setErrors] = useState({});
  const [resultsVisible, setResultsVisible] = useState(false);

  const [history, setHistory] = useState([
    { date: 'Day 1', averageWeight: 1.4, fcr: 1.9 },
    { date: 'Day 2', averageWeight: 1.55, fcr: 1.85 },
    { date: 'Day 3', averageWeight: 1.7, fcr: 1.8 },
    { date: 'Day 4', averageWeight: 1.82, fcr: 1.95 },
    { date: 'Day 5', averageWeight: 1.95, fcr: 1.88 },
  ]);

  const handleSampleCountChange = (e) => {
    const value = parseInt(e.target.value, 10) || 0;
    if (value <= 0) {
      setSampleCount(0);
      setWeights([]);
      return;
    }
    setSampleCount(value);
    setWeights((prev) => {
      const clone = [...prev];
      if (value > clone.length) {
        return [...clone, ...Array(value - clone.length).fill('')];
      }
      return clone.slice(0, value);
    });
  };

  const handleWeightChange = (index, value) => {
    setWeights((prev) => {
      const clone = [...prev];
      clone[index] = value;
      return clone;
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!date) newErrors.date = 'Please select a date.';

    if (!sampleCount || sampleCount <= 0) {
      newErrors.sampleCount = 'Sample count must be greater than 0.';
    }

    const numericWeights = weights.map((w) => (w === '' ? NaN : Number(w)));

    if (numericWeights.some((w) => Number.isNaN(w))) {
      newErrors.weights = 'Please enter all sample weights.';
    } else if (numericWeights.some((w) => w <= 0)) {
      newErrors.weights = 'Weights must be greater than 0.';
    }

    const feedVal = Number(totalFeed);
    if (!totalFeed) {
      newErrors.totalFeed = 'Please enter total feed given.';
    } else if (Number.isNaN(feedVal) || feedVal <= 0) {
      newErrors.totalFeed = 'Total feed must be a positive number.';
    }

    if (totalTruckWeight) {
      const truckVal = Number(totalTruckWeight);
      if (Number.isNaN(truckVal) || truckVal <= 0) {
        newErrors.totalTruckWeight = 'Truck weight must be a positive number.';
      }
    }

    if (previousTotalWeight) {
      const prevVal = Number(previousTotalWeight);
      if (Number.isNaN(prevVal) || prevVal < 0) {
        newErrors.previousTotalWeight = 'Previous total weight cannot be negative.';
      }
    }

    if (!totalTruckWeight && !totalChickenCount) {
      newErrors.totalChickenCount =
        'Provide either total truck weight or total chicken count.';
    }

    if (totalChickenCount) {
      const totalCountVal = Number(totalChickenCount);
      if (Number.isNaN(totalCountVal) || totalCountVal <= 0) {
        newErrors.totalChickenCount = 'Total chicken count must be a positive number.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = () => {
    if (!validate()) {
      setResultsVisible(false);
      return;
    }

    const numericWeights = weights.map((w) => Number(w));
    const sumWeights = numericWeights.reduce((acc, cur) => acc + cur, 0);

    // Average weight per bird in the sample.
    const avgWeight = sumWeights / numericWeights.length;

    // Total weight gain:
    // 1) If truck weights are provided: gain = current truck weight - previous truck weight.
    // 2) Otherwise: approximate gain using sample average * total chicken count.
    let gain;
    if (totalTruckWeight && previousTotalWeight) {
      gain = Number(totalTruckWeight) - Number(previousTotalWeight);
    } else {
      gain = avgWeight * Number(totalChickenCount || 0);
    }

    if (gain <= 0) {
      setErrors({
        ...errors,
        totalWeightGain: 'Calculated total weight gain must be greater than 0.',
      });
      setResultsVisible(false);
      return;
    }

    // Feed Conversion Ratio (FCR) = total feed given / total weight gain.
    const feedVal = Number(totalFeed);
    const calculatedFcr = feedVal / gain;

    setAverageWeight(avgWeight);
    setTotalWeightGain(gain);
    setFcr(calculatedFcr);
    setResultsVisible(true);

    setHistory((prev) => {
      const newEntry = {
        date,
        averageWeight: Number(avgWeight.toFixed(3)),
        fcr: Number(calculatedFcr.toFixed(3)),
      };
      const updated = [...prev, newEntry];
      if (updated.length > 5) {
        return updated.slice(updated.length - 5);
      }
      return updated;
    });
  };

  const handleReset = () => {
    setDate("");
    setSampleCount(5);
    setWeights(Array(5).fill(""));
    setTotalFeed("");
    setTotalTruckWeight("");
    setPreviousTotalWeight("");
    setTotalChickenCount("");
    setAverageWeight(null);
    setTotalWeightGain(null);
    setFcr(null);
    setErrors({});
    setResultsVisible(false);
  };

  const handleSave = () => {
    if (!resultsVisible) return;
    // This simply logs to the console instead of calling a backend.
    console.log('Saved Hen Management record:', {
      date,
      sampleCount,
      weights,
      totalFeed,
      totalTruckWeight,
      previousTotalWeight,
      totalChickenCount,
      averageWeight,
      totalWeightGain,
      fcr,
    });
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94);
    doc.text('Hen Management Report', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    if (resultsVisible) {
      doc.setFontSize(13);
      doc.setTextColor(0);
      doc.text('Performance Metrics', 14, 40);

      autoTable(doc, {
        startY: 44,
        head: [['Metric', 'Value']],
        body: [
          ['Average Weight (kg)', averageWeight != null ? averageWeight.toFixed(3) : '--'],
          ['Total Weight Gain (kg)', totalWeightGain != null ? totalWeightGain.toFixed(2) : '--'],
          ['FCR (Feed Conversion Ratio)', fcr != null ? fcr.toFixed(3) : '--'],
          ['Total Feed Given (kg)', totalFeed || '--'],
          ['Date', date || '--'],
          ['Sampled Chickens', sampleCount],
          ['Total Chicken Count', totalChickenCount || '--'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] },
        styles: { fontSize: 11 },
        columnStyles: { 0: { cellWidth: 100 } },
      });
    }

    const tableY = resultsVisible ? doc.lastAutoTable.finalY + 10 : 40;
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text('Weight & FCR Trend (Last 5 Records)', 14, tableY);

    autoTable(doc, {
      startY: tableY + 4,
      head: [['Date', 'Average Weight (kg)', 'FCR']],
      body: history.map(h => [h.date, h.averageWeight, h.fcr]),
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 10 },
    });

    doc.save(`hen-management-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getFcrColor = () => {
    if (fcr == null) return '#0f172a';
    if (fcr <= 1.8) return '#16a34a';
    if (fcr <= 2.2) return '#ea580c';
    return '#dc2626';
  };

  const cardBaseStyle = {
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
    backdropFilter: 'blur(18px)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  const cardHoverStyle = {
    transform: 'translateY(-4px) scale(1.01)',
    boxShadow: '0 28px 60px rgba(15, 23, 42, 0.16)',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 40%, #ecfdf5 100%)',
      }}
    >
      <OwnerNavbar />

      <div style={{ padding: '24px', flex: 1 }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Header */}
          <div
            style={{
              background:
                'linear-gradient(120deg, rgba(34, 197, 94, 0.95), rgba(59, 130, 246, 0.95))',
              borderRadius: '28px',
              padding: '28px 24px',
              color: 'white',
              boxShadow: '0 24px 60px rgba(22, 163, 74, 0.45)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at top left, rgba(255,255,255,0.4), transparent 55%)',
                opacity: 0.8,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: '30px',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    marginBottom: '6px',
                  }}
                >
                  Hen Management Dashboard
                </h1>
                <p
                  style={{
                    fontSize: '16px',
                    color: 'rgba(241,245,249,0.92)',
                    maxWidth: '520px',
                  }}
                >
                  Track poultry performance, monitor weight gain, and optimize feed efficiency
                  for your flocks.
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(15, 23, 42, 0.26)',
                  borderRadius: '999px',
                  padding: '10px 16px',
                  border: '1px solid rgba(226, 232, 240, 0.28)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '999px',
                    background: 'rgba(34, 197, 94, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                  }}
                >
                  🐔
                </div>
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.85 }}>Admin Access</div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Owner Only View</div>
                </div>
              </div>
            </div>
          </div>

          {/* Input + Results */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
              gap: '20px',
            }}
          >
            {/* Input Section */}
            <div
              style={{
                ...cardBaseStyle,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardBaseStyle)}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#0f172a',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Performance Input
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>
                    Enter sample weights and feed details to calculate key performance metrics.
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    padding: '6px 10px',
                    borderRadius: '999px',
                    background: '#ecfdf5',
                    color: '#15803d',
                    border: '1px solid rgba(22, 163, 74, 0.3)',
                  }}
                >
                  5-day tracking with history
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  marginTop: '8px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: errors.date ? '1px solid #dc2626' : '1px solid #d1d5db',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  {errors.date && (
                    <span style={{ color: '#dc2626', fontSize: '12px' }}>{errors.date}</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    Sampled Chickens
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sampleCount}
                    onChange={handleSampleCountChange}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: errors.sampleCount ? '1px solid #dc2626' : '1px solid #d1d5db',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  {errors.sampleCount && (
                    <span style={{ color: '#dc2626', fontSize: '12px' }}>
                      {errors.sampleCount}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    Total Feed Given (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalFeed}
                    onChange={(e) => setTotalFeed(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: errors.totalFeed ? '1px solid #dc2626' : '1px solid #d1d5db',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  {errors.totalFeed && (
                    <span style={{ color: '#dc2626', fontSize: '12px' }}>
                      {errors.totalFeed}
                    </span>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  marginTop: '4px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    Current Truck Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalTruckWeight}
                    onChange={(e) => setTotalTruckWeight(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: errors.totalTruckWeight
                        ? '1px solid #dc2626'
                        : '1px solid #d1d5db',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  {errors.totalTruckWeight && (
                    <span style={{ color: '#dc2626', fontSize: '12px' }}>
                      {errors.totalTruckWeight}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    Previous Truck Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={previousTotalWeight}
                    onChange={(e) => setPreviousTotalWeight(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: errors.previousTotalWeight
                        ? '1px solid #dc2626'
                        : '1px solid #d1d5db',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  {errors.previousTotalWeight && (
                    <span style={{ color: '#dc2626', fontSize: '12px' }}>
                      {errors.previousTotalWeight}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    Total Chicken Count (for estimate)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalChickenCount}
                    onChange={(e) => setTotalChickenCount(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: errors.totalChickenCount
                        ? '1px solid #dc2626'
                        : '1px solid #d1d5db',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  {errors.totalChickenCount && (
                    <span style={{ color: '#dc2626', fontSize: '12px' }}>
                      {errors.totalChickenCount}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '10px' }}>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#0f172a',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Sample Weights (kg)</span>
                  {errors.weights && (
                    <span style={{ color: '#dc2626', fontSize: '12px' }}>
                      {errors.weights}
                    </span>
                  )}
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                    gap: '8px',
                    marginTop: '8px',
                  }}
                >
                  {Array.from({ length: sampleCount }).map((_, index) => (
                    <input
                      key={index}
                      type="number"
                      min="0"
                      step="0.01"
                      value={weights[index] || ''}
                      onChange={(e) => handleWeightChange(index, e.target.value)}
                      placeholder={`#${index + 1}`}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '12px',
                        border: errors.weights ? '1px solid #dc2626' : '1px solid #d1d5db',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleCalculate}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '999px',
                      border: 'none',
                      cursor: 'pointer',
                      background:
                        'linear-gradient(135deg, #22c55e 0%, #16a3e0 50%, #2563eb 100%)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '14px',
                      boxShadow: '0 16px 40px rgba(37, 99, 235, 0.4)',
                      transform: 'translateY(0)',
                      transition:
                        'transform 0.2s ease, box-shadow 0.2s ease, filter 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                      e.currentTarget.style.boxShadow =
                        '0 20px 50px rgba(37, 99, 235, 0.6)';
                      e.currentTarget.style.filter = 'brightness(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow =
                        '0 16px 40px rgba(37, 99, 235, 0.4)';
                      e.currentTarget.style.filter = 'brightness(1)';
                    }}
                  >
                    Calculate Performance
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '999px',
                      border: '1px solid #cbd5f5',
                      cursor: 'pointer',
                      background: 'white',
                      color: '#1f2937',
                      fontWeight: 500,
                      fontSize: '13px',
                      transition: 'background 0.15s ease, transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#eff6ff';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={downloadPDF}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '999px',
                      border: '1px solid #bfdbfe',
                      cursor: 'pointer',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      fontWeight: 500,
                      fontSize: '13px',
                      transition: 'background 0.15s ease, transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#dbeafe';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#eff6ff';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    📄 Download PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!resultsVisible}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '999px',
                      border: '1px solid #bbf7d0',
                      cursor: resultsVisible ? 'pointer' : 'not-allowed',
                      background: resultsVisible ? '#ecfdf5' : '#f9fafb',
                      color: '#166534',
                      fontWeight: 500,
                      fontSize: '13px',
                      opacity: resultsVisible ? 1 : 0.6,
                      transition:
                        'background 0.15s ease, transform 0.15s ease, opacity 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!resultsVisible) return;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Save Record (Console)
                  </button>
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    maxWidth: '260px',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '18px',
                      height: '18px',
                      borderRadius: '999px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    i
                  </span>
                  <span>
                    FCR (Feed Conversion Ratio) = Total Feed Given ÷ Total Weight Gain.
                    Lower values indicate better feed efficiency.
                  </span>
                </div>
              </div>
            </div>

            {/* Result Section */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  ...cardBaseStyle,
                  padding: '18px 18px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardBaseStyle)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#0f172a',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Key Performance Metrics
                  </h3>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>
                    Auto-calculated from your inputs
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '10px',
                  }}
                >
                  {/* Average Weight */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #ecfdf5 0%, #dcfce7 80%)',
                      borderRadius: '18px',
                      padding: '12px 14px',
                      border: '1px solid rgba(22, 163, 74, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#15803d',
                        }}
                      >
                        Average Weight
                      </span>
                      <span style={{ fontSize: '16px' }}>⚖️</span>
                    </div>
                    <div
                      style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        color: '#14532d',
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {averageWeight != null ? averageWeight.toFixed(3) : '--'}
                      <span style={{ fontSize: '11px', marginLeft: '4px' }}>kg</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#166534' }}>
                      Based on {sampleCount || 0} sampled birds
                    </span>
                  </div>

                  {/* Total Weight Gain */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 80%)',
                      borderRadius: '18px',
                      padding: '12px 14px',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#1d4ed8',
                        }}
                      >
                        Total Weight Gain
                      </span>
                      <span style={{ fontSize: '16px' }}>📈</span>
                    </div>
                    <div
                      style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        color: '#1d4ed8',
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {totalWeightGain != null ? totalWeightGain.toFixed(2) : '--'}
                      <span style={{ fontSize: '11px', marginLeft: '4px' }}>kg</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#1e3a8a' }}>
                      From truck or estimated from flock size
                    </span>
                    {errors.totalWeightGain && (
                      <span style={{ color: '#dc2626', fontSize: '11px' }}>
                        {errors.totalWeightGain}
                      </span>
                    )}
                  </div>

                  {/* FCR */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 90%)',
                      borderRadius: '18px',
                      padding: '12px 14px',
                      border: `1px solid ${getFcrColor()}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: getFcrColor(),
                        }}
                      >
                        FCR (Feed Conversion)
                      </span>
                      <span style={{ fontSize: '16px' }}>📊</span>
                    </div>
                    <div
                      style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        color: getFcrColor(),
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {fcr != null ? fcr.toFixed(3) : '--'}
                    </div>
                    <span style={{ fontSize: '11px', color: '#4b5563' }}>
                      {fcr == null && 'Awaiting calculation'}
                      {fcr != null && fcr <= 1.8 && 'Excellent efficiency'}
                      {fcr != null && fcr > 1.8 && fcr <= 2.2 && 'Acceptable performance'}
                      {fcr != null && fcr > 2.2 && 'Needs attention – review feed program'}
                    </span>
                  </div>
                </div>
              </div>

              {/* History / small hint */}
              <div
                style={{
                  ...cardBaseStyle,
                  padding: '12px 14px',
                  fontSize: '12px',
                  color: '#6b7280',
                }}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardBaseStyle)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    Last {history.length} records are used to build the trend graph below.
                  </span>
                  <span style={{ opacity: 0.85 }}>Trend overview</span>
                </div>
              </div>
            </div>
          </div>

          {/* Graph Section */}
          <div
            style={{
              ...cardBaseStyle,
              padding: '20px',
              marginTop: '4px',
            }}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardBaseStyle)}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#0f172a',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Weight & FCR Trend (Last 5 Records)
                </h3>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                  Visualize how average bird weight and FCR evolve across recent entries.
                </p>
              </div>
            </div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={history}
                  margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="left"
                    stroke="#22c55e"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#2563eb"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 12px 30px rgba(15,23,42,0.12)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="averageWeight"
                    name="Average Weight (kg)"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    animationDuration={600}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="fcr"
                    name="FCR"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    animationDuration={600}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HenManagement;

