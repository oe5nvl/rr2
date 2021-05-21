#!/usr/bin/env python2
# -*- coding: utf-8 -*-
##################################################
# GNU Radio Python Flow Graph
# Title: SSB Receiver V2- F1ATB - MARCH 2021
# Author: F1ATB - BUHART
# Description: RX SSBfor Adalm Pluto SDR
# Generated: Thu May 20 17:44:23 2021
##################################################


from gnuradio import analog
from gnuradio import blocks
from gnuradio import eng_notation
from gnuradio import filter
from gnuradio import gr
from gnuradio import iio
from gnuradio.eng_option import eng_option
from gnuradio.fft import logpwrfft
from gnuradio.filter import firdes
from optparse import OptionParser
import SimpleXMLRPCServer
import threading


class pluto_rx_ssb_v2(gr.top_block):

    def __init__(self):
        gr.top_block.__init__(self, "SSB Receiver V2- F1ATB - MARCH 2021")

        ##################################################
        # Variables
        ##################################################
        self.samp_rate = samp_rate = 1200000
        self.Largeur_filtre = Largeur_filtre = 3800
        self.xlate_filter_taps = xlate_filter_taps = firdes.low_pass(1, samp_rate, Largeur_filtre/2, 500)
        self.decim_LP = decim_LP = 16
        self.LSB_USB = LSB_USB = 0
        self.Gain_RF = Gain_RF = 30
        self.Gain_IF = Gain_IF = 20
        self.Gain_BB = Gain_BB = 20
        self.FrRX = FrRX = 145000000
        self.F_Fine = F_Fine = 0

        ##################################################
        # Blocks
        ##################################################
        self.xmlrpc_server_0 = SimpleXMLRPCServer.SimpleXMLRPCServer(('localhost', 9003), allow_none=True)
        self.xmlrpc_server_0.register_instance(self)
        self.xmlrpc_server_0_thread = threading.Thread(target=self.xmlrpc_server_0.serve_forever)
        self.xmlrpc_server_0_thread.daemon = True
        self.xmlrpc_server_0_thread.start()
        self.pluto_source_0 = iio.pluto_source('192.168.2.1', 145000000, int(samp_rate), 1000000, 32768, True, True, True, "manual", 50, '', True)
        self.low_pass_filter_0 = filter.fir_filter_ccf(1, firdes.low_pass(
        	1, decim_LP*samp_rate/200, 5200, 1200, firdes.WIN_HAMMING, 6.76))
        self.logpwrfft_x_0 = logpwrfft.logpwrfft_c(
        	sample_rate=samp_rate/100,
        	fft_size=2048,
        	ref_scale=0.00001,
        	frame_rate=samp_rate/100/2048,
        	avg_alpha=1.0,
        	average=False,
        )
        self.iio_attr_updater_0_0 = iio.attr_updater('hardwaregain', str(int(Gain_RF*1.75)), 1000)
        self.iio_attr_updater_0 = iio.attr_updater('frequency', str(int(FrRX)), 1000)
        self.iio_attr_sink_0_0 = iio.attr_sink("ip:192.168.2.1", "ad9361-phy", "voltage0", 0, False, False)
        self.iio_attr_sink_0 = iio.attr_sink("ip:192.168.2.1", "ad9361-phy", "altvoltage0", 0, True, False)
        self.freq_xlating_fir_filter_xxx_0 = filter.freq_xlating_fir_filter_ccc(120, (xlate_filter_taps), F_Fine-Largeur_filtre/2+LSB_USB*Largeur_filtre-100+LSB_USB*200, samp_rate)
        self.fractional_resampler_xx_0 = filter.fractional_resampler_cc(0, decim_LP/2)
        self.blocks_udp_sink_1 = blocks.udp_sink(gr.sizeof_short*2048, '127.0.0.1', 9002, 4096, True)
        self.blocks_udp_sink_0 = blocks.udp_sink(gr.sizeof_short*1, '127.0.0.1', 9001, 1000, True)
        self.blocks_multiply_xx_0_0 = blocks.multiply_vff(1)
        self.blocks_multiply_xx_0 = blocks.multiply_vff(1)
        self.blocks_multiply_const_vxx_0 = blocks.multiply_const_vff((1-2*LSB_USB, ))
        self.blocks_keep_m_in_n_0 = blocks.keep_m_in_n(gr.sizeof_gr_complex, int(1024*decim_LP), 204800, 0)
        self.blocks_float_to_short_1 = blocks.float_to_short(2048, 100)
        self.blocks_float_to_short_0 = blocks.float_to_short(1, 16000)
        self.blocks_complex_to_float_0 = blocks.complex_to_float(1)
        self.blocks_add_xx_0 = blocks.add_vff(1)
        self.analog_sig_source_x_0_0 = analog.sig_source_f(samp_rate/120, analog.GR_SIN_WAVE, Largeur_filtre/2+100, 1, 0)
        self.analog_sig_source_x_0 = analog.sig_source_f(samp_rate/120, analog.GR_COS_WAVE, Largeur_filtre/2+100, 1, 0)
        self.analog_agc2_xx_0 = analog.agc2_cc(1e-1, 1e-2, 1.0, 1.0)
        self.analog_agc2_xx_0.set_max_gain(100)



        ##################################################
        # Connections
        ##################################################
        self.msg_connect((self.iio_attr_updater_0, 'out'), (self.iio_attr_sink_0, 'attr'))
        self.msg_connect((self.iio_attr_updater_0_0, 'out'), (self.iio_attr_sink_0_0, 'attr'))
        self.connect((self.analog_agc2_xx_0, 0), (self.blocks_complex_to_float_0, 0))
        self.connect((self.analog_sig_source_x_0, 0), (self.blocks_multiply_xx_0, 0))
        self.connect((self.analog_sig_source_x_0_0, 0), (self.blocks_multiply_xx_0_0, 1))
        self.connect((self.blocks_add_xx_0, 0), (self.blocks_float_to_short_0, 0))
        self.connect((self.blocks_complex_to_float_0, 0), (self.blocks_multiply_const_vxx_0, 0))
        self.connect((self.blocks_complex_to_float_0, 1), (self.blocks_multiply_xx_0_0, 0))
        self.connect((self.blocks_float_to_short_0, 0), (self.blocks_udp_sink_0, 0))
        self.connect((self.blocks_float_to_short_1, 0), (self.blocks_udp_sink_1, 0))
        self.connect((self.blocks_keep_m_in_n_0, 0), (self.low_pass_filter_0, 0))
        self.connect((self.blocks_multiply_const_vxx_0, 0), (self.blocks_multiply_xx_0, 1))
        self.connect((self.blocks_multiply_xx_0, 0), (self.blocks_add_xx_0, 0))
        self.connect((self.blocks_multiply_xx_0_0, 0), (self.blocks_add_xx_0, 1))
        self.connect((self.fractional_resampler_xx_0, 0), (self.logpwrfft_x_0, 0))
        self.connect((self.freq_xlating_fir_filter_xxx_0, 0), (self.analog_agc2_xx_0, 0))
        self.connect((self.logpwrfft_x_0, 0), (self.blocks_float_to_short_1, 0))
        self.connect((self.low_pass_filter_0, 0), (self.fractional_resampler_xx_0, 0))
        self.connect((self.pluto_source_0, 0), (self.blocks_keep_m_in_n_0, 0))
        self.connect((self.pluto_source_0, 0), (self.freq_xlating_fir_filter_xxx_0, 0))

    def get_samp_rate(self):
        return self.samp_rate

    def set_samp_rate(self, samp_rate):
        self.samp_rate = samp_rate
        self.set_xlate_filter_taps(firdes.low_pass(1, self.samp_rate, self.Largeur_filtre/2, 500))
        self.pluto_source_0.set_params(145000000, int(self.samp_rate), 1000000, True, True, True, "manual", 50, '', True)
        self.low_pass_filter_0.set_taps(firdes.low_pass(1, self.decim_LP*self.samp_rate/200, 5200, 1200, firdes.WIN_HAMMING, 6.76))
        self.logpwrfft_x_0.set_sample_rate(self.samp_rate/100)
        self.analog_sig_source_x_0_0.set_sampling_freq(self.samp_rate/120)
        self.analog_sig_source_x_0.set_sampling_freq(self.samp_rate/120)

    def get_Largeur_filtre(self):
        return self.Largeur_filtre

    def set_Largeur_filtre(self, Largeur_filtre):
        self.Largeur_filtre = Largeur_filtre
        self.set_xlate_filter_taps(firdes.low_pass(1, self.samp_rate, self.Largeur_filtre/2, 500))
        self.freq_xlating_fir_filter_xxx_0.set_center_freq(self.F_Fine-self.Largeur_filtre/2+self.LSB_USB*self.Largeur_filtre-100+self.LSB_USB*200)
        self.analog_sig_source_x_0_0.set_frequency(self.Largeur_filtre/2+100)
        self.analog_sig_source_x_0.set_frequency(self.Largeur_filtre/2+100)

    def get_xlate_filter_taps(self):
        return self.xlate_filter_taps

    def set_xlate_filter_taps(self, xlate_filter_taps):
        self.xlate_filter_taps = xlate_filter_taps
        self.freq_xlating_fir_filter_xxx_0.set_taps((self.xlate_filter_taps))

    def get_decim_LP(self):
        return self.decim_LP

    def set_decim_LP(self, decim_LP):
        self.decim_LP = decim_LP
        self.low_pass_filter_0.set_taps(firdes.low_pass(1, self.decim_LP*self.samp_rate/200, 5200, 1200, firdes.WIN_HAMMING, 6.76))
        self.fractional_resampler_xx_0.set_resamp_ratio(self.decim_LP/2)
        self.blocks_keep_m_in_n_0.set_m(int(1024*self.decim_LP))

    def get_LSB_USB(self):
        return self.LSB_USB

    def set_LSB_USB(self, LSB_USB):
        self.LSB_USB = LSB_USB
        self.freq_xlating_fir_filter_xxx_0.set_center_freq(self.F_Fine-self.Largeur_filtre/2+self.LSB_USB*self.Largeur_filtre-100+self.LSB_USB*200)
        self.blocks_multiply_const_vxx_0.set_k((1-2*self.LSB_USB, ))

    def get_Gain_RF(self):
        return self.Gain_RF

    def set_Gain_RF(self, Gain_RF):
        self.Gain_RF = Gain_RF
        self.iio_attr_updater_0_0.update_value(str(int(self.Gain_RF*1.75)))

    def get_Gain_IF(self):
        return self.Gain_IF

    def set_Gain_IF(self, Gain_IF):
        self.Gain_IF = Gain_IF

    def get_Gain_BB(self):
        return self.Gain_BB

    def set_Gain_BB(self, Gain_BB):
        self.Gain_BB = Gain_BB

    def get_FrRX(self):
        return self.FrRX

    def set_FrRX(self, FrRX):
        self.FrRX = FrRX
        self.iio_attr_updater_0.update_value(str(int(self.FrRX)))

    def get_F_Fine(self):
        return self.F_Fine

    def set_F_Fine(self, F_Fine):
        self.F_Fine = F_Fine
        self.freq_xlating_fir_filter_xxx_0.set_center_freq(self.F_Fine-self.Largeur_filtre/2+self.LSB_USB*self.Largeur_filtre-100+self.LSB_USB*200)


def main(top_block_cls=pluto_rx_ssb_v2, options=None):

    tb = top_block_cls()
    tb.start()
    tb.wait()


if __name__ == '__main__':
    main()
