// third party
import { merge } from 'lodash-es';

// project imports
import Alert from './Alert';
import Avatar from './Avatar';
import Button from './Button';
import Card from './Card';
import CardActions from './CardActions';
import CardContent from './CardContent';
import CardHeader from './CardHeader';
import Checkbox from './Checkbox';
import Chip from './Chip';
import DataGrid from './DataGrid';
import DatePicker from './DatePicker';
import Divider from './Divider';
import DateTimePickerToolbar from './DateTimePickerToolbar';
import Dialog from './Dialog';
import DialogTitle from './DialogTitle';
import InputBase from './InputBase';
import OutlinedInput from './OutlinedInput';
import ListItemButton from './ListItemButton';
import ListItemIcon from './ListItemIcon';
import ListItemText from './ListItemText';
import Paper from './Paper';
import Select from './Select';
import Slider from './Slider';
import TableCell from './TableCell';
import Tabs from './Tabs';
import Typography from './Typography';

// ===============================||  OVERRIDES - MAIN  ||=============================== //

export default function ComponentsOverrides(theme, borderRadius, outlinedFilled) {
  return merge(
    Alert(theme),
    Avatar(theme),
    Button(borderRadius),
    Card(borderRadius),
    CardActions,
    CardContent(),
    CardHeader(theme),
    Checkbox(),
    Chip(theme),
    DataGrid(theme),
    DatePicker(),
    DateTimePickerToolbar(),
    Dialog(borderRadius),
    DialogTitle(),
    Divider(theme),
    InputBase(theme),
    OutlinedInput(borderRadius, outlinedFilled),
    ListItemButton(theme),
    ListItemIcon(theme),
    ListItemText(theme),
    Paper(borderRadius),
    Select(),
    Slider(theme),
    TableCell(theme),
    Tabs(theme),
    Typography(theme)
  );
}
