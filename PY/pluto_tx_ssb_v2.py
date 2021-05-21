#!/usr/bin/env python2
# -*- coding: utf-8 -*-
##################################################
# GNU Radio Python Flow Graph
# Title: SSB Transmitter V2 - F1ATB - MARCH 2021
# Author: F1ATB - BUHART
# Description: TX SSB Adalm Pluto SDR
# Generated: Wed Apr 21 06:30:00 2021
##################################################


from gnuradio import blocks
from gnuradio import eng_notation
from gnuradio import filter
from gnuradio import gr
from gnuradio import iio
from gnuradio.eng_option import eng_option
from gnuradio.filter import firdes
from optparse import OptionParser
import SimpleXMLRPCServer
import threading


class pluto_tx_ssb_v2(gr.top_block):

    def __init__(self):
        gr.top_block.__init__(self, "SSB Transmitter V2 - F1ATB - MARCH 2021")

        ##################################################
        # Variables
        ##################################################
        self.samp_rate = samp_rate = 1200000
        self.LSB_USB = LSB_USB = 1
        self.GainRF_TX = GainRF_TX = 100
        self.GainIF_TX = GainIF_TX = 300
        self.GainBB_TX = GainBB_TX = 40
        self.Fr_TX = Fr_TX = 145200000

        ##################################################
        # Blocks
        ##################################################
        self.xmlrpc_server_0 = SimpleXMLRPCServer.SimpleXMLRPCServer(('localhost', 9004), allow_none=True)
        self.xmlrpc_server_0.register_instance(self)
        self.xmlrpc_server_0_thread = threading.Thread(target=self.xmlrpc_server_0.serve_forever)
        self.xmlrpc_server_0_thread.daemon = True
        self.xmlrpc_server_0_thread.start()
        self.rational_resampler_xxx_1_0 = filter.rational_resampler_ccc(
                interpolation=120,
                decimation=1,
                taps=None,
                fractional_bw=None,
        )
        self.pluto_sink_0 = iio.pluto_sink('192.168.2.1', 145000000, int(samp_rate), 0, 0x8000, False, 0, '', True)
        self.iio_attr_updater_0 = iio.attr_updater('frequency', str(int(Fr_TX)), 2500)
        self.iio_attr_sink_0 = iio.attr_sink("ip:192.168.2.1", "ad9361-phy", "altvoltage1", 0, True, False)
        self.hilbert_fc_0 = filter.hilbert_fc(64, firdes.WIN_HAMMING, 6.76)
        (self.hilbert_fc_0).set_min_output_buffer(10)
        (self.hilbert_fc_0).set_max_output_buffer(10)
        self.blocks_udp_source_0 = blocks.udp_source(gr.sizeof_short*1, '127.0.0.1', 9005, 512, True)
        (self.blocks_udp_source_0).set_max_output_buffer(2048)
        self.blocks_short_to_float_0 = blocks.short_to_float(1, 32767)
        self.blocks_multiply_const_vxx_0 = blocks.multiply_const_vff((LSB_USB, ))
        self.blocks_float_to_complex_0 = blocks.float_to_complex(1)
        self.blocks_complex_to_float_0 = blocks.complex_to_float(1)
        self.band_pass_filter_0_0 = filter.fir_filter_ccc(1, firdes.complex_band_pass(
        	1, samp_rate/120, -1300+LSB_USB*1500, 1300+LSB_USB*1500, 200, firdes.WIN_HAMMING, 6.76))



        ##################################################
        # Connections
        ##################################################
        self.msg_connect((self.iio_attr_updater_0, 'out'), (self.iio_attr_sink_0, 'attr'))
        self.connect((self.band_pass_filter_0_0, 0), (self.rational_resampler_xxx_1_0, 0))
        self.connect((self.blocks_complex_to_float_0, 0), (self.blocks_float_to_complex_0, 0))
        self.connect((self.blocks_complex_to_float_0, 1), (self.blocks_multiply_const_vxx_0, 0))
        self.connect((self.blocks_float_to_complex_0, 0), (self.band_pass_filter_0_0, 0))
        self.connect((self.blocks_multiply_const_vxx_0, 0), (self.blocks_float_to_complex_0, 1))
        self.connect((self.blocks_short_to_float_0, 0), (self.hilbert_fc_0, 0))
        self.connect((self.blocks_udp_source_0, 0), (self.blocks_short_to_float_0, 0))
        self.connect((self.hilbert_fc_0, 0), (self.blocks_complex_to_float_0, 0))
        self.connect((self.rational_resampler_xxx_1_0, 0), (self.pluto_sink_0, 0))

    def get_samp_rate(self):
        return self.samp_rate

    def set_samp_rate(self, samp_rate):
        self.samp_rate = samp_rate
        self.pluto_sink_0.set_params(145000000, int(self.samp_rate), 0, 0, '', True)
        self.band_pass_filter_0_0.set_taps(firdes.complex_band_pass(1, self.samp_rate/120, -1300+self.LSB_USB*1500, 1300+self.LSB_USB*1500, 200, firdes.WIN_HAMMING, 6.76))

    def get_LSB_USB(self):
        return self.LSB_USB

    def set_LSB_USB(self, LSB_USB):
        self.LSB_USB = LSB_USB
        self.blocks_multiply_const_vxx_0.set_k((self.LSB_USB, ))
        self.band_pass_filter_0_0.set_taps(firdes.complex_band_pass(1, self.samp_rate/120, -1300+self.LSB_USB*1500, 1300+self.LSB_USB*1500, 200, firdes.WIN_HAMMING, 6.76))

    def get_GainRF_TX(self):
        return self.GainRF_TX

    def set_GainRF_TX(self, GainRF_TX):
        self.GainRF_TX = GainRF_TX

    def get_GainIF_TX(self):
        return self.GainIF_TX

    def set_GainIF_TX(self, GainIF_TX):
        self.GainIF_TX = GainIF_TX

    def get_GainBB_TX(self):
        return self.GainBB_TX

    def set_GainBB_TX(self, GainBB_TX):
        self.GainBB_TX = GainBB_TX

    def get_Fr_TX(self):
        return self.Fr_TX

    def set_Fr_TX(self, Fr_TX):
        self.Fr_TX = Fr_TX
        self.iio_attr_updater_0.update_value(str(int(self.Fr_TX)))


def main(top_block_cls=pluto_tx_ssb_v2, options=None):

    tb = top_block_cls()
    tb.start()
    tb.wait()


if __name__ == '__main__':
    main()
