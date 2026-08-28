using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;

public partial class slideBanner : ez.web.controls.ControlBase
{

    string picWidth = "640"; //圖片的寬
    string picHeight = "480"; //圖片的高
    string picNoImg = "../App_Script/noimage_us.jpg"; //當沒有圖片時用的圖，如果圖片路徑為upload/noimg.jpg，那請設為noimg.jpg即可
    int proCount = 6;  //呈現商品數
    string category = "推薦商品";

    product product = new product();

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            
            product.DataQuery queryInfo = new product.DataQuery();
            queryInfo.SelectColumns = "num,pro_name,pic,range";   //需包含group by的欄位，所以range需加上
            queryInfo.nation = nation;
            queryInfo.inTime = true;
            queryInfo.category = category;
            queryInfo.Sort = "range";
            queryInfo.PageSize = proCount;
            queryInfo.NowPage = 1;
            queryInfo.selectTop = true;
            product.QuerySource = queryInfo;
            if (product.Query())
            {
                Repeater1.DataSource = product.QueryView;
                Repeater1.DataBind();
            }
            else
            {
                Response.Write(product.log);
            }

        }
    }

    protected void Repeater1_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        
        DataRowView row = (DataRowView)e.Item.DataItem;
        Image pic = (Image)e.Item.FindControl("pic");
        pic.ImageUrl = "~/app_script/DisplayCut.ashx?file=" + picNoImg + "&w=" + picWidth + "&h=" + picHeight;
        pic.AlternateText = "No Image";
        if (!f.isStrNull(row["pic"]))
        {
            string rootDir = product.Dir.Replace("~/", "");
            string[] pics = row["pic"].ToString().Split(',');
            foreach (string picFile in pics)
            {
                if (!f.isStrNull(picFile))
                {
                    pic.ImageUrl = "~/app_script/DisplayCut.ashx?file=" + picFile + "&rootDir=" + rootDir + "&w=" + picWidth + "&h=" + picHeight;
                    pic.AlternateText = row["pro_name"].ToString();
                    break;
                }
            }
        }
    }

}