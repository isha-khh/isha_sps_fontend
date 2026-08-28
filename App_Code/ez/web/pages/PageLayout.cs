///1.15.0216@前台PageLayout模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// PageLayout 的摘要描述
/// </summary>
public class PageLayout
{
//based on bootstrap3
//    public enum ScreenSizes{xlg,lg,md,sm,xs,xxs};
    public enum ScreenSizes { xs, sm, md, lg };
    public enum CustomAreas { side1, content, side2, floating };
    public enum AreaSets { both, left, right, none };
    public bool showFloating=true;
    public AreaSets areaSet = AreaSets.both;
    public int[, ,] columnSets = new int[4, 4, 3] { 
        {{12,12,12}, {12,12,12} , {4,8,12}, {2,8,2} },
        {{12,12,0} , {12,12,0}  , {3,9,0} , {3,9,0} },
        {{0,12,12} , {0,12,12}  , {0,9,3} , {0,9,3} },
        {{0,12,0}  , {0,12,0}   , {0,12,0} , {0,12,0} }
    }; //(AreaSets/ScreenSizes/columns)
    public string[] areaNames = { "side side1", "content", "side side2", "floating" };
    public string[] ScrSizeClasses  = { "col-", "col-md-", "col-lg-", "col-xl-"};
    public string[] visibleClasses = { "", "d-md-block", "d-lg-block", "d-xl-block" };
    public string[] hiddenClasses = { "d-none", "d-md-none", "d-lg-none", "d-xl-none" };
    public PageLayout()
	{
        
	}
    public string getRwdClasses(CustomAreas area)
    {
        string r = "";
        r = areaNames[(int)area];
        ScreenSizes s;
        for (s = ScreenSizes.lg; s >= ScreenSizes.xs; s--)
        {
            int col = columnSets[(int)areaSet, (int)s, (int)area];
            if (col == 0) {
                r += " " + hiddenClasses[(int)s];
            }
            else
            {
                r += " " + ScrSizeClasses[(int)s] + col.ToString();
            }
        }
        return r;
    }
    public void useAreaSet(string sidetype)
    {
        sidetype = (sidetype == null) ? "" : sidetype.ToLower();
        if (sidetype == "none")
        {
            areaSet = PageLayout.AreaSets.none;
        }
        else if (sidetype == "left")
        {
            areaSet = PageLayout.AreaSets.left;
        }
        else if (sidetype == "right")
        {
            areaSet = PageLayout.AreaSets.right;
        }
        else
        {
            areaSet = PageLayout.AreaSets.both;
        }
    }
}

