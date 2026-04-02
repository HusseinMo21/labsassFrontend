import React from 'react';
import {
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  structuredReferenceKey,
  structuredUnitKey,
  type LabReportTemplate,
} from '../../constants/labReportTemplatePresets';

type Props = {
  displayName: string;
  code: string;
  template: LabReportTemplate;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  legacySingle?: string;
  resultStatus: string;
  resultNotes: string;
  lineStatus: string;
  onResultStatus: (v: string) => void;
  onResultNotes: (v: string) => void;
  onLineStatus: (v: string) => void;
  showAdminCompleted: boolean;
};

const StructuredLabTestResultCard: React.FC<Props> = ({
  displayName,
  code,
  template,
  values,
  onChange,
  legacySingle,
  resultStatus,
  resultNotes,
  lineStatus,
  onResultStatus,
  onResultNotes,
  onLineStatus,
  showAdminCompleted,
}) => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {displayName}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Code: {code}
          {template.title ? ` · ${template.title}` : ''}
        </Typography>

        {legacySingle ? (
          <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
            Previous single-line result (not in table): {legacySingle}
          </Typography>
        ) : null}

        <TableContainer sx={{ mb: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="22%">Parameter</TableCell>
                <TableCell width="18%">Result</TableCell>
                <TableCell width="12%">Unit</TableCell>
                <TableCell>Reference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {template.parameters.map((p) => {
                const unitKey = structuredUnitKey(p.key);
                const refKey = structuredReferenceKey(p.key);
                const unitSelect = !!(p.unit_options && p.unit_options.length > 0);
                const refSelect = !!(p.reference_options && p.reference_options.length > 0);

                return (
                  <TableRow key={p.key}>
                    <TableCell>{p.label}</TableCell>
                    <TableCell>
                      {p.input === 'select' && p.options?.length ? (
                        <FormControl fullWidth size="small" variant="standard">
                          <Select
                            displayEmpty
                            value={values[p.key] ?? ''}
                            onChange={(e) => onChange(p.key, e.target.value)}
                          >
                            <MenuItem value="">
                              <em>—</em>
                            </MenuItem>
                            {p.options.map((opt) => (
                              <MenuItem key={opt} value={opt}>
                                {opt}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <TextField
                          size="small"
                          fullWidth
                          variant="standard"
                          multiline={!!p.multiline}
                          minRows={p.multiline ? 2 : 1}
                          value={values[p.key] ?? ''}
                          onChange={(e) => onChange(p.key, e.target.value)}
                          placeholder="—"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {unitSelect ? (
                        <FormControl fullWidth size="small" variant="standard">
                          <Select
                            displayEmpty
                            value={values[unitKey] ?? ''}
                            onChange={(e) => onChange(unitKey, e.target.value)}
                          >
                            <MenuItem value="">
                              <em>—</em>
                            </MenuItem>
                            {p.unit_options!.map((opt) => (
                              <MenuItem key={opt} value={opt}>
                                {opt}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {p.unit || '—'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {refSelect ? (
                        <FormControl fullWidth size="small" variant="standard">
                          <Select
                            displayEmpty
                            value={values[refKey] ?? ''}
                            onChange={(e) => onChange(refKey, e.target.value)}
                          >
                            <MenuItem value="">
                              <em>—</em>
                            </MenuItem>
                            {p.reference_options!.map((opt) => (
                              <MenuItem key={opt} value={opt}>
                                {opt}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {p.reference || '—'}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Result status (overall)</InputLabel>
              <Select
                label="Result status (overall)"
                value={resultStatus || 'normal'}
                onChange={(e) => onResultStatus(e.target.value)}
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="abnormal">Abnormal</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Line status</InputLabel>
              <Select label="Line status" value={lineStatus} onChange={(e) => onLineStatus(e.target.value)}>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="under_review">Under review</MenuItem>
                {showAdminCompleted ? <MenuItem value="completed">Completed</MenuItem> : null}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={12}>
            <TextField
              fullWidth
              size="small"
              label="Notes"
              value={resultNotes}
              onChange={(e) => onResultNotes(e.target.value)}
              placeholder="Comments, method, or interpretation"
              multiline
              minRows={2}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default StructuredLabTestResultCard;
