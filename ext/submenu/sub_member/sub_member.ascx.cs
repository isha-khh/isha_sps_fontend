using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;

public partial class ext_submenu_sub_member_sub_member : ez.web.controls.SubNavControl
{
    
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            ViewState["dropdown_submenu"] = "";
            if (MultiView1.ActiveViewIndex == -1)
            {
                member member = new member();
                member.isLogin();
                info WebSet = new info();
                WebSet.Load();
                initMemMenu(member.Data, WebSet.Data);
            }


            if (MultiView1.ActiveViewIndex == 0)
            {
                //判斷是否需要補寄認證信按鈕(*因為uc抓取語系的時間在MemInfoGet之後，所以必需在page_Load才能抓到)
                mailword mailword = new mailword("memActive", nation);
                mailword.Load();
                if (mailword.Data.status) { activeLi.Visible = true; }
            }


        }
    }

    public void MemInfoGet(member.DataInfo MemInfo, info.DataInfo WebSetData)
    {
        initMemMenu(MemInfo, WebSetData);
    }

    public void initMemMenu(member.DataInfo Data, info.DataInfo WebSetData)
    {
        MultiView1.ActiveViewIndex = (Data.isOk ? 1 : 0);   //如果有資料表示有登入會員       
        if (MultiView1.ActiveViewIndex == 0)
        {
            //是否有開放非會員購物
            order order = new order(nation);
            if (!order.order_only_member) { orderLi.Visible = true; }

        }
    }


    protected void logout_Click(object sender, EventArgs e)
    {
        member member = new member();
        member.Logout();
        Response.Redirect(Request.Url.AbsoluteUri);
    }

}