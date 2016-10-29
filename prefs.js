const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Gettext = imports.gettext.domain('AutomaticShutdownTimer');
const _ = Gettext.gettext;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;
const Pango = imports.gi.Pango;

// options
const SHUTDOWN = 0;
const REBOOT = 1;
const SUSPEND = 2;
const SHUTDOWNAFTERTIME = 0;
const SHUTDOWNONTIME = 1;
let settings, widget;

function init() {
    settings = Convenience.getSettings();
}

const AutomaticShutdownTimerPrefs = new GObject.Class({
    Name: 'AutomaticShutdownTimer.Prefs',
    GTypeName: 'AutomaticShutdownTimerPrefs',
    Extends: Gtk.Grid,

    _init: function() {
        this.parent();
        this.margin = 12;

        //this.row_homogeneous = true;
        this.column_homogeneous = true;
        this.row_spacing = this.column_spacing = 5;
        // this.vexpand = true;
        // this.hexpand = true;
        // this.resize_mode = 0;

       //this.set_orientation(Gtk.Orientation.VERTICAL);
        this.attach(new Gtk.Label({ label:'Shutdown:'}), 0, 0, 1, 1);
        //1st row
        let afterTime = new Gtk.RadioButton({label: 'after time expires'});
        afterTime.connect('toggled', Lang.bind(this, function() {
                settings.set_int('timer', SHUTDOWNAFTERTIME);
        }));
        this.attach(afterTime, 2, 0, 2, 1);

        let onTime = new Gtk.RadioButton({group: afterTime,
                                          label: 'on time(24h format)'});
        onTime.connect('toggled', Lang.bind(this, function() {
                settings.set_int('timer', SHUTDOWNONTIME);
        }));
        this.attach_next_to(onTime, afterTime, Gtk.PositionType.RIGHT, 2, 1);

        let timeSet = settings.get_int('timer')
        if (timeSet === SHUTDOWNONTIME) {
          onTime.active = true;
        }
        else{
          afterTime.active = true;
        }

        this.attach(new Gtk.HSeparator(), 0, 2, 6, 1);
        this.attach(new Gtk.Label({ label:'Time:'}), 0, 3, 1, 1);
        //2nd row
        let hour_label = new Gtk.Label({ label:' Hours '});
        let min_label = new Gtk.Label({ label: 'Minutes'});
        let sec_label = new Gtk.Label({ label: 'Seconds'});
        this.attach(hour_label, 2, 3, 1, 1);
        this.attach_next_to(min_label, hour_label, Gtk.PositionType.RIGHT, 1, 1);
        this.attach_next_to(sec_label, min_label, Gtk.PositionType.RIGHT, 1, 1);

        //3rd row
        let hours = new Gtk.SpinButton({ orientation: Gtk.Orientation.VERTICAL});
        hours.set_increments(1, 1);
        hours.modify_font(Pango.font_description_from_string('30'))
        hours.set_range(0, 24);
        hours.set_value(0);
        hours.set_value(settings.get_int('minutes-value'));
        hours.set_wrap(true)
        hours.connect('value-changed', Lang.bind(this, function(){
          settings.set_int('hours-value', hours.get_value_as_int());
        }));
        hours.set_value(settings.get_int('hours-value'));
        this.attach(hours, 2, 4, 1, 1);

        let minutes = new Gtk.SpinButton({ orientation: Gtk.Orientation.VERTICAL});
        minutes.set_increments(1, 1);
        minutes.modify_font(Pango.font_description_from_string('30'))
        minutes.set_range(-1, 60);
        minutes.set_value(settings.get_int('minutes-value'));

        let tmp_min = minutes.get_value_as_int()
        minutes.connect('value-changed', Lang.bind(this, function(){
          let time = minutes.get_value_as_int()
          if ( time === 60) {
            if (tmp_min < time) {
              minutes.set_value(0)
              let val = hours.get_value_as_int() + 1
              hours.set_value(val)
            }
          }
          if ( time < 0) {
            if (tmp_min > time) {
              minutes.set_value(59)
              let val = hours.get_value_as_int() - 1
              hours.set_value(val)
            }
          }
          tmp_min = time;
          settings.set_int('minutes-value', minutes.get_value_as_int());
        }));
        this.attach_next_to(minutes, hours, Gtk.PositionType.RIGHT, 1, 1);

        // init seconds
        let seconds = new Gtk.SpinButton({ orientation: Gtk.Orientation.VERTICAL});
        seconds.modify_font(Pango.font_description_from_string('30'))
        seconds.set_increments(1, 1);
        seconds.set_range(-1, 60);
        seconds.set_value(settings.get_int('seconds-value'));

        // handle change
        let tmp_secs = seconds.get_value_as_int()
        seconds.connect('value-changed', Lang.bind(this, function(){
          let cs_time = seconds.get_value_as_int()
          if ( cs_time === 60) {
            if (tmp_secs < cs_time) {
              seconds.set_value(0)
              let val = minutes.get_value_as_int() + 1
              if (val === 60) {
                  hours.set_value(hours.get_value_as_int() + 1)
                  val = 0
              }
              minutes.set_value(val)
            }
          }
          if ( cs_time < 0) {
            if (tmp_secs > cs_time) {
              seconds.set_value(59)
              let val = minutes.get_value_as_int()
              val = val - 1
              if (val < 0) {
                let hval;
                hval = hours.get_value_as_int()
                if (hval > 0) {
                  hours.set_value(hval - 1)
                }
                val = 0
              }
              minutes.set_value(val)
            }
          }
          tmp_secs = cs_time;
          settings.set_int('seconds-value', seconds.get_value_as_int());
        }));
        this.attach_next_to(seconds, minutes, Gtk.PositionType.RIGHT, 1, 1);

        this.attach(new Gtk.HSeparator(), 0, 5, 6, 1);
        this.attach(new Gtk.Label({ label:'Action:'}), 0, 6, 1, 1);
        //4rd row
        let shutdownRbtn = new Gtk.RadioButton({label: 'Shutdown'});
        shutdownRbtn.connect('toggled', Lang.bind(this, function() {
                settings.set_int('action', SHUTDOWN);
        }));
        this.attach(shutdownRbtn, 2, 6, 1, 1);

        let restartRbtn = new Gtk.RadioButton({ group: shutdownRbtn,
                                            label: 'Restart'});
        restartRbtn.connect('toggled', Lang.bind(this, function() {
                settings.set_int('action', REBOOT);
        }));
        this.attach_next_to(restartRbtn, shutdownRbtn, Gtk.PositionType.RIGHT, 1, 1);

        let suspendRbtn = new Gtk.RadioButton({ group: shutdownRbtn,
                                            label: 'Suspend'});
        suspendRbtn.connect('toggled', Lang.bind(this, function() {
                settings.set_int('action', SUSPEND);
        }));
        this.attach_next_to(suspendRbtn, restartRbtn, Gtk.PositionType.RIGHT, 1, 1);

        let set = settings.get_int('action');
        if (set === SHUTDOWN) {
          shutdownRbtn.active = true;
        }
        else if (set === REBOOT) {
          restartRbtn.active = true;
        }
        else if (set === SUSPEND) {
          suspendRbtn.active = true;
        }

        this.attach(new Gtk.HSeparator(), 0, 7, 6, 1);
        let start = new Gtk.Button ({label: "Start"});

        start.connect('clicked', Lang.bind(this, function(){
          global.log(!settings.get_boolean('timer-start'))
          settings.set_boolean('timer-start', !settings.get_boolean('timer-start'));
          let w = this.get_window()
          w.destroy()
        }));
        this.attach(start, 2, 8, 3, 1);
    }

});

function buildPrefsWidget() {
    widget = new AutomaticShutdownTimerPrefs;
    widget.show_all();

    return widget;
}
