# Adjust path to add polus-render
import contextlib
import sys
import os
from urllib.parse import ParseResult, urlparse
from pathlib import Path, PurePath
import argparse
from typing import Union
import re

# Initialize command line arguments
parser = argparse.ArgumentParser(prog="polis-render-wrapper", description="polus-render package wrapper for Node.JS child_process")
parser.add_argument('-i', '--image_location', action='store', default=None, dest="image_location", help="URL or File Path to Zarr/Tif file", required=False)
parser.add_argument('-o', '--overlay_location', action='store', default=None, dest="overlay_location", help="URL or File Path to MicroJSON file", required=False)
parser.add_argument('-t', '--use_online', action=argparse.BooleanOptionalAction, default=False, dest="use_online", help="Use online render", required=False)
args = parser.parse_args()


# Print blockers to ensure output is exactly what Node.js wants
def blockPrint():
    sys.stdout = open(os.devnull, 'w')

def enablePrint():
    sys.stdout = sys.__stdout__

# Add polus to path
script_dir = os.path.dirname( __file__ )
mymodule_dir = os.path.join( script_dir, 'polus-render', 'src' )
sys.path.append(mymodule_dir)
import polus



def build_custom_render(image_location: Union[ParseResult,PurePath] = "", overlay_location:Union[ParseResult,PurePath] = ""):
    """
    Call Polus.render and prints the str output.

    Args:
        image_location (ParseResult | PurePath, optional): _description_. Defaults to "".
        overlay_location (ParseResult | PurePath, optional): _description_. Defaults to "".

    Returns:
        _type_: _description_
    """
    print(polus.render(image_location=image_location, microjson_overlay_location=overlay_location))

def convert_args_for_render(target:str)->Union[ParseResult,PurePath,str]:
    """
    Return the target as either a PurePath or ParseResult

    Args:
        target (str): string to convert
    returns: if target is a URL, returns ParseResult, otherwise, return PurePath. If target is empty, return empty string
    Pre: target is either url or path. 
    Post: If pre is not met, ParseResult of a url return is 100% guaranteed; however, PurePath of a path is not guaranteed
    """
    if len(target) == 0:
        return target

    url_regex = r"(?i)\b((?:https?://|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'\".,<>?«»“”‘’]))"
    result = re.findall(url_regex, target)

    if len(result) > 0:
        return urlparse(target)
    else:
        return Path(target)
def main():
    """
    Entry point to the wrapper
    """
    # Extract args
    image_location = convert_args_for_render(r'{}'.format(args.image_location)) if args.image_location else ""
    overlay_location = convert_args_for_render(r'{}'.format(args.overlay_location)) if args.overlay_location else ""
    # Call render
    with open(os.devnull, 'w') as devnull:
        with contextlib.redirect_stdout(devnull):    
            render_url = polus.render(image_location=image_location, microjson_overlay_location=overlay_location, use_local_render= not args.use_online)
    
    # Output render url
    print(render_url)

if __name__ == "__main__":
    main()


